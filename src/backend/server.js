const io = require('socket.io')(8000);

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const { verifyWithGoogle, verifyWithCookie } = require('./authentication.js');
const { StudentSocket } = require('./server-socket/student');
const { TeacherSocket } = require('./server-socket/teacher');

process.on('uncaughtException', err => {
	console.error(err.stack);
});

io.on('connection', socket => {
	function initUser(user, loginMethod) {
		if (user) {
			if (!socket.handlerClass) {
				if (user.accountType == 'student') {
					socket.handlerClass = new StudentSocket(io, socket, user.userId, db);
				} else if (user.accountType == 'teacher') {
					socket.handlerClass = new TeacherSocket(io, socket, user.userId, db);
				}
			}
			socket.emit('loginSuccessful', {user, loginMethod});
		} else {
			socket.emit('loginFailure', loginMethod);
		}
	}
	socket.on('loginWithGoogle', async ({token, accountType}) => {
		let user = await verifyWithGoogle(token, accountType, db);
		initUser(user, 'google');
	});
	socket.on('loginWithCookie', ({cookie}) => {
		let user = verifyWithCookie(cookie, db);
		initUser(user, 'cookie');
	});
});