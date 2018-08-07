import {events} from './global.js';

class HistoryManager {
  constructor() {
    this.stateStack = [undefined];
    this.backButtonHandlers = {};
    this.lastState = undefined;
    this.eventIsReal = true;
    this.popStateCallbackQueue = [];
    this.onPopState((currentState, previousState, direction) => {
      if (direction == 'backward' && this.backButtonHandlers[previousState] && this.eventIsReal) {
        this.backButtonHandlers[previousState].callFromBackButtonHandler();
      }
    });
  }
  onPopState(callback) {
    addEventListener('popstate', event => {
      var currentState = event.state ? event.state[0] : undefined;
      // assume all states are unique
      let direction;
      let index = this.stateStack.indexOf(currentState);
      if (this.stateStack[index - 1] == this.lastState) {
        direction = 'forward';
      } else if (this.stateStack[index + 1] == this.lastState) {
        direction = 'backward';
      } else {
        throw new Error('Couldn\'t figure out direction of popstate');
      }
      if (this.popStateCallbackQueue.length <= 1) { // and direction == back
        this.popStateCallbackQueue = []; // assume queue before = [undefined]
        events.emit('all-popstate-events-dequeued');
      } else if (this.popStateCallbackQueue.length > 1) {
        let cb = this.popStateCallbackQueue.splice(1, 1)[0];
        cb();
      }
      callback(currentState, this.lastState, direction);
      this.lastState = currentState;
      this.eventIsReal = true;
    });
  }
  waitForPreviousPopState() {
    return new Promise(res => {
      if (this.popStateCallbackQueue.length === 0) {
        this.popStateCallbackQueue.push(undefined);
        res();
      } else this.popStateCallbackQueue.push(res);
    });
  }
  waitForAllPopStateEvents() {
    return new Promise(res => {
      if (this.popStateCallbackQueue.length === 0) res();
      else events.on('all-popstate-events-dequeued', res);
    });
  }
  async backWithoutTriggeringCallback() {
    await this.waitForPreviousPopState();
    this.eventIsReal = false;
    history.back();
  }
  async forwardWithoutTriggeringCallback() {
    await this.waitForPreviousPopState();
    this.eventIsReal = false;
    history.forward();
  }
  async pushState(state) {
    await this.waitForAllPopStateEvents();
    history.pushState([state], null); // overwrites from the middle and deletes the rest of the stack
    let previousState = this.lastState;
    this.lastState = state;
    this.stateStack = this.stateStack.slice(0, this.stateStack.indexOf(previousState) + 1); // delete stack after
    this.stateStack.push(state);
  }
  backButtonCallable(fromState, func, manualControl) {
    const hm = this;
    async function handler() {
      if (!manualControl)
        await hm.backWithoutTriggeringCallback();
      return func.apply(this, arguments);
    }
    handler.callFromBackButtonHandler = () => console.error('back button was pressed before component initialized but after a function was wrapped in `backButtonCallable`');
    handler._isBackButtonBound = true;
    this.backButtonHandlers[fromState] = handler;
    getComponentOfMethod(handler).then(that => {
      handler.callFromBackButtonHandler = async () => {
        if (manualControl) {
          await hm.forwardWithoutTriggeringCallback();
        }
        return func.apply(that, []);
      }; // special way to call the function for the popstate event handler only, a version which doesn't call history.back()
    });
    return handler;
  }
}

export const historyManager = new HistoryManager();

var untrackedMethods = new Map(); // key: method, value: callback when found
function getComponentOfMethod(method) {
  return new Promise(res => {
    untrackedMethods.set(method, that => res(that));
  });
}

export const HistoryMixin = {
  created() {
    Object.entries(this.$options.methods).map(kvPair => kvPair[1]).filter(method => method._isBackButtonBound).forEach(method => {
      try {
        let callback = untrackedMethods.get(method);
        callback(this);
      } catch (err) {
        console.error('HistoryMixin.created(): something went wrong');
      }
    });
  }
};