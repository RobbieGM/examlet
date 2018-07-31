class ServerSocket {
	constructor(io, socket, userId, db) {
		this.io = io;
		this.socket = socket;
		this.userId = userId;
		this.db = db;
		const ignore = ['user', '_getInstanceMethodNames'];
		for (let method of this._getInstanceMethodNames(this, Object.prototype)) {
			if (ignore.includes(method))
				continue;
			socket.on(method, this.constructor.prototype[method].bind(this));
		}
		socket.on('disconnect', () => ServerSocket.instanceSet.delete(this));
		ServerSocket.instanceSet.add(this);
	}
	static get sockets() {
		return Object.freeze([...ServerSocket.instanceSet]);
	}
	_getInstanceMethodNames(obj, stop) {
		function hasMethod(obj, name) {
			const desc = Object.getOwnPropertyDescriptor (obj, name);
			return !!desc && typeof desc.value === 'function';
		}
		let array = [];
		let proto = Object.getPrototypeOf(obj);
		while (proto && proto !== stop) {
			Object.getOwnPropertyNames(proto).forEach(name => {
				if (name !== 'constructor') {
					if (hasMethod(proto, name)) {
						array.push(name);
					}
				}
			});
			proto = Object.getPrototypeOf(proto);
		}
		return array;
	}
	sanitizeUser(user, include=['name', 'userId', 'email', 'profilePicture']) {
		return include.reduce((o, k) => {
			o[k] = user[k];
			return o;
		}, {});
	}
	get user() {
		return this.db.get('accounts').find({ userId: this.userId });
	}
	getAccountById(id) {
		return this.db.get('accounts').find({userId: id}).value();
	}
}

ServerSocket.instanceSet = new Set();

module.exports = { ServerSocket };