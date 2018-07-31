import {socket} from './global.js';

const SocketMixin = {
	methods: {
		_forEachSocketHandler(f) {
			let handlers = this.$options.socketHandlers;
			if (handlers) {
				Object.keys(handlers).forEach(key => {
					f(key, handlers[key].bind(this));
				});
			}
		}
	},
	created() {
		this._forEachSocketHandler((key, fn) => socket.on(key, fn));
	},
	beforeDestroy() {
		this._forEachSocketHandler((key, fn) => socket.off(key, fn));
	}
};

export default SocketMixin;