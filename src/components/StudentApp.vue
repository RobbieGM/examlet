<template><div>
	<transition name='fade' mode='out-in'>
		<ExamContainer v-if='currentBottomNavigationTab == "Tests"' key='tests' account-type='student' :exams='this.exams'/>
		<div v-if='currentBottomNavigationTab == "Classes"' key='classes'>
			<transition name='fade' mode='out-in'>
				<div class='loader' v-if='!loadedClasses'></div>
				<div v-else id='teacher-container'>
					<div v-for='teacher in classes' class='teacher' @click='showTeacherSheet(teacher)' :key='teacher.userId'>
						<h3>{{ teacher.name }}</h3>
						<div class='flex-container'>
							<div class='light-text'>
								<div>{{ percentage(teacher.averageScore) }}% average score</div>
								<div>{{ teacher.totalExams }} total tests</div>
							</div>
							<img :src='teacher.profilePicture'/>
						</div>
					</div>
				</div>
			</transition>
			<sheet ref='teacherSheet' side='bottom' class='teacher-bottom-sheet'>
				<h3><img :src='teacherSheet.currentTeacher.profilePicture'/>{{ teacherSheet.currentTeacher.name }}</h3>
				<div class='option' @click='toggleTeacherSubscription(teacherSheet.currentTeacher.userId)'>
					<span class='material-icons'>{{ this.user.teachers.includes(teacherSheet.currentTeacher.userId) ? "check_box" : "check_box_outline_blank" }}</span>Receive exams
				</div>
				<div class='option' @click='sendEmail(teacherSheet.currentTeacher.email)'>
					<span class='material-icons'>email</span>Send email
				</div>
			</sheet>
		</div>
		<div v-if='currentBottomNavigationTab == "Grades"' key='grades'>
			<transition name='fade' mode='out-in'>
				<div class='loader' v-if='!loadedGrades'></div>
				<div v-else id='grade-container'>
				</div>
			</transition>
		</div>
	</transition>
	<div id='bottom-navigation'>
		<div v-for='[icon, text] in bottomNavigationOptions' @click='bottomNavigationSwitch(text)' :class='{"current-tab": currentBottomNavigationTab == text}' :key='text'>
			<span class='material-icons'>{{ icon }}</span>
			<span>{{ text }}</span>
		</div> 
	</div>
</div></template>

<style scoped lang='scss'>
@import '../css/variables';

#teacher-container {
	display: flex;
	flex-wrap: wrap;
}

.teacher {
	@include card;
	cursor: pointer;
	h3 {
		margin-top: 0;
	}
	img {
		@include profile-picture;
	}
}

.teacher-bottom-sheet {
	h3 {
		background: $accent;
		margin: 0;
		padding: 1em;
		text-align: left;
		display: flex;
		align-items: center;
	}

	h3 img {
		@include profile-picture(40px);
		margin-right: 16px;
	}

	.option {
		display: flex;
		height: 56px;
		align-items: center;
		cursor: pointer;
		background: $bkg-light;
		transition: background 0.2s ease-out;
		&:active, &.held-down {
			transition: none;
			background: $bkg;
		}
	}

	.option span.material-icons {
		color: $text-light;
		margin: 0 16px;
	}
}

#bottom-navigation {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background: $bkg-light;
	box-shadow: 0 1px 5px rgba(0, 0, 0, 0.15);
	height: 56px;
	display: flex;
	justify-content: center;
	align-items: center;
	& > div {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		cursor: pointer;
		text-align: center;
		width: 120px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: color 0.2s;
		&.current-tab {
			color: $accent2;
		}
	}
	span { display: block }
}
</style>

<script>
	import {sendEmail, socket, events, percentage} from '../client-lib/global.js';
	import ExamContainer from './ExamContainer.vue';
	export default {
		props: ['user'],
		data: () => ({
			currentBottomNavigationTab: 'Tests',
			bottomNavigationOptions: [
				['assignment', 'Tests'],
				['class', 'Classes'],
				['grade', 'Grades']
			],
			teacherSheet: {
				currentTeacher: {},
			},
			exams: [],
			classes: [],
			loadedClasses: false,
			loadedGrades: false
		}),
		methods: {
			sendEmail: sendEmail,
			toggleTeacherSubscription(teacherId) {
				if (this.user.teachers.includes(teacherId)) {
					this.user.teachers.splice(this.user.teachers.findIndex(teacherId2 => teacherId2 == teacherId), 1);
				} else {
					this.user.teachers.push(teacherId);
				}
				this.$forceUpdate();
				socket.emit('updateTeacherSubscriptions', this.user.teachers);
			},
			bottomNavigationSwitch(tab) {
				this.currentBottomNavigationTab = tab;
				if (tab == 'Classes' && !this.loadedClasses) socket.emit('loadClasses');
				if (tab == 'Grades' && !this.loadedGrades) socket.emit('loadGrades');
			},
			showTeacherSheet(teacher) {
				this.teacherSheet.currentTeacher = teacher;
				this.$refs.teacherSheet.show();
			},
			percentage
		},
		socketHandlers: {
			endLoadGrades() {
				this.loadedGrades = true;
			},
			endLoadClasses() {
				this.loadedClasses = true;
			},
			gradeLoaded(grade) {
				this.grades.push(grade);
				this.loadedGrades = true;
			},
			classLoaded(teacher) {
				this.classes.push(teacher);
				if (teacher.isSubscribed && !this.user.teachers.includes(teacher.userId)) {
					events.emit('updateUserTeachers', [teacher.userId, ...this.user.teachers]);
				}
				this.loadedClasses = true;
			},
			updateExams(exams) {
				this.exams = exams;
			}
		},
		components: {ExamContainer},
		mounted() {
			socket.emit('loadExams');
		}
	};
</script>