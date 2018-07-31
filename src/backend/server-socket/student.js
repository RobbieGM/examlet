const { ServerSocket } = require('./common.js');

class StudentSocket extends ServerSocket {
	constructor(...args) {
		super(...args);
		this.accountType = 'student';
	}
	loadExams() {
		let exams = this.db.get('examPreviews').value();
		let myTeachers = this.user.value().teachers;
		let preparedExams = exams.filter(
			exam => myTeachers.includes(exam.teacherId) && exam.open
		).map(exam => ({
			teacher: this.sanitizeUser(this.getAccountById(exam.teacherId, 'teacher')),
			...exam
		}));
		this.socket.emit('updateExams', preparedExams);
	}
	startExam(examId) {
		const omitAnswer = ({answer, ...question}) => question;
		let questions = this.db.get('examQuestions').get(examId).value().map(omitAnswer);
		this.socket.emit('examQuestionsLoaded', {examId, questions});
	}
	handIn({examId, responses}) {
		let answers = this.db.get('examQuestions').get(examId).value().map(q => q.answer);
		let check = (response, i) => answers[i] == response;
		let boolToNumber = x => x ? 1 : 0;
		let total = (a, b) => a + b;

		let score = responses.map(check).map(boolToNumber).reduce(total);
		this.socket.emit('examGraded', {examId, score});
	}
	loadClasses() {
		this.db.get('accounts').filter({accountType: 'teacher'}).value().forEach(teacher => {
			let scores = this.db.get('examPreviews').filter({ teacherId: teacher.userId }).value().map(exam => exam.averageScore);
			let averageScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
			let isSubscribed = this.user.value().teachers.includes(teacher.userId);
			this.socket.emit('classLoaded', {totalExams: scores.length, averageScore, isSubscribed, ...teacher});
		});
		this.socket.emit('endLoadClasses');
	}
	updateTeacherSubscriptions(teachers) {
		this.user.set('teachers', teachers).write();
		this.socket.emit('clearExams');
		this.loadExams();
	}
	loadGrades() {
		this.socket.emit('endLoadGrades');
	}
}

module.exports = { StudentSocket };