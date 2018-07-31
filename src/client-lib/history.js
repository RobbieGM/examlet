class HistoryManager {
	constructor() {
		this.historyStates = [null];
		this.backButtonHandlers = {};
		this.eventTrusted = true; // we can't have artificial history.back() calls triggering popstate, hence this ugly hack
		addEventListener('popstate', event => {
			let previousState = this.historyStates[this.historyStates.length - 1];
			if (this.backButtonHandlers[previousState] && this.eventTrusted) {
				this.backButtonHandlers[previousState].callFromBackButtonHandler();
			}
			this.historyStates.push(event.state ? event.state[0] : null);
		});
	}
	backButtonCallable(fromState, func) {
		let hm = this;
		let handler = function() {
			hm.back();
			return func.apply(this, arguments);
    };
    handler.callFromBackButtonHandler = () => console.error('back button was pressed before component initialized but after a function was wrapped in `backButtonCallable`');
    //FIXME: this can be fixed by providing a skeleton for both real and wrapped so it cant happen??
    getComponentOfMethod(func).then(that => {
			console.log('worked, adding new cfbbh');
      handler.callFromBackButtonHandler = () => {
        return func.apply(that, []);
      }; // special way to call the function for the popstate event handler only, a version which doesn't call history.back()
    });
		handler._isBackButtonBound = true;
		this.backButtonHandlers[fromState] = handler;
		return handler;
	}
	onBackFrom(fromState, handler) {
		this.backButtonHandlers[fromState] = handler;
		return handler;
	}
	pushState(state) {
		history.pushState([state], null);
		this.historyStates.push(state);
	}
	back() {
		this.eventTrusted = false;
		history.back();
		setTimeout(() => this.eventTrusted = true, 50);
	}
}

export const historyManager = new HistoryManager();

var untrackedMethods = new Map(); // method, callback when found
function getComponentOfMethod(method) {
	return new Promise(res => {
    untrackedMethods.set(method, that => res(that));
	});
}

export const HistoryMixin = {
  created() {
		// eslint-disable-next-line
    Object.entries(this.$options.methods).map(([key, method]) => method).filter(method => method._isBackButtonBound).forEach(method => {
      if (method in untrackedMethods) {
        let callback = untrackedMethods.get(method);
        callback(this);
      }
    });
  }
};

/* component is only accessible either from mixin or when function is called. Must be bound to component in final. Perhaps await component creation?*/