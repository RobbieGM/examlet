const { ServerSocket } = require('./common.js');

class TeacherSocket extends ServerSocket {
	constructor(...args) {
		super(...args);
		this.accountType = 'teacher';
	}
	loadMyExams() {
		let exams = this.db.get('examPreviews').value();
		let preparedExams = exams.filter(
			exam => exam.teacherId == this.user.value().userId
		).map(exam => ({
			teacher: this.sanitizeUser(this.user.value()),
			...exam
		}));
		this.socket.emit('updateExams', preparedExams);
	}
	setExamIsOpen(examId, open) {
		this.db.get('examPreviews').find({examId}).assign({open}).write();
		ServerSocket.sockets.filter(handlerInstance =>
			handlerInstance.user.value().teachers.includes(this.user.value().userId) && handlerInstance.accountType == 'student'
		).forEach(handlerInstance => {
			handlerInstance.loadExams();
		});
		this.loadMyExams();
	}
	hostExam(examId) {
		this.setExamIsOpen(examId, true);
	}
	unhostExam(examId) {
		this.setExamIsOpen(examId, false);
	}
}

module.exports = { TeacherSocket };