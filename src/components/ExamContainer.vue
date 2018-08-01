<template>
	<div id='exam-container'>
		<div v-for='exam in exams' class='exam' :key='exam.examId' @click='openExam($event, exam)'>
			<h3 class='exam-name'>{{ exam.name }}</h3>
			<div class='flex-container'>
				<div class='light-text'>
					<div>{{ exam.teacher.name }}</div>
					<div>{{ percentage(exam.averageScore) }}% average score</div>
				</div>
				<img :src='exam.teacher.profilePicture' alt='Profile picture'/>
			</div>
		</div>
		<div class='exam' id='fullscreen-exam' :style='fullscreenExam.styles'>
			<h3 class='exam-name'>
				<span class='fullscreen-exam-back material-icons' @click='closeFullscreenExam'>arrow_back</span>
				{{ fullscreenExam.examObj.name }}
			</h3>
			<div class='stagger-transition'>
				<div class='flex-container'>
					<div class='light-text'>
						<div>{{ fullscreenExam.examObj.teacher.name }}</div>
						<div>{{ percentage(fullscreenExam.examObj.averageScore) }}% average score</div>
					</div>
					<img :src='fullscreenExam.examObj.teacher.profilePicture' alt='Teacher profile picture'/>
				</div>
				<div style='margin-left: -8px'>
					<button v-if='accountType == "student"' @click='startExam(fullscreenExam.examObj)'>Start</button>
					<button v-if='accountType == "teacher" && !fullscreenExam.examObj.open' @click='hostExam'>Open to Students</button>
					<button v-if='accountType == "teacher" && fullscreenExam.examObj.open' @click='unhostExam'>Close to Students</button>
				</div>
				<h3>Stats</h3>
				<p>Feature does not exist yet.</p>
			</div>
			<exam-taker v-if='accountType == "student" && loadedExamTaker' :questions='fullscreenExam.questions' :exam='fullscreenExam.examObj' :fullscreen='fullscreenExam.examTakerActive' @close-exam-taker='closeExamTaker()'></exam-taker>
		</div>
	</div>
</template>

<style scoped lang='scss'>
@import '../css/variables';

.no-transition {
	transition: none 0s !important;
	transition-duration: 0s !important;
}

.stagger-transition > * { transition: all 0.2s ease-out; }

@for $n from 1 to 15 {
	.stagger-transition > :nth-child(#{$n}) { transition-delay: $n * 0.075s; }
}

#exam-container {
	display: flex;
	flex-wrap: wrap;
}

.exam {
	@include card;
	cursor: pointer;
	padding-top: 0;
	h3.exam-name {
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		transition: all 0.2s $ease;
	}
	img {
		@include profile-picture;
	}
}

#fullscreen-exam {
	position: fixed;
	box-shadow: none;
	border-radius: 0;
	visibility: hidden;
	margin: 0;
	z-index: 2;
	transition: all 0.2s $ease;
	will-change: top, left, width, height;
	cursor: auto;
	overflow-y: overlay;
	overflow-x: hidden;
	-webkit-overflow-scrolling: touch;
	h3.exam-name {
		transition: all 0.2s $ease;
		margin: 0 -16px;
		padding: 1em;
		position: relative;
	}
	&.animating-out, &.animating-in {
		overflow-y: hidden;
	}	
	&:not(.animating-out) .stagger-transition > * {
		opacity: 0;
		transform: translateX(20px);
	}
	&.active:not(.animating-out) .stagger-transition > * {
		opacity: 1;
		transform: none;
	}
	&.animating-out .stagger-transition > * {
		transition-delay: 0s;
		opacity: 0;
		transform: none;
	}
	&.animating-out .stagger-transition > :first-child {
		opacity: 1;
	}
	&.active {
		box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
		visibility: visible;
		top: 0 !important;
		left: 0 !important;
		width: 100% !important;
		height: 100% !important;
		h3.exam-name {
			background: $bkg;
			margin-bottom: 1.25rem;	
		}
		.fullscreen-exam-back {
			opacity: 1;
			visibility: visible;
		}
	}
}

.fullscreen-exam-back {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	width: 56px;
	height: 56px;
	text-align: center;
	line-height: 56px;
	color: $text-light;
	cursor: pointer;
	transition: all 0.2s $ease;
	opacity: 0;
	visibility: 0;
	&:active, &.held-down {
		color: $text;
		transition: none;
	}
}

</style>

<script>
	import {$, percentage, getParentUntilMatches, preventScroll, enableScroll, sleep, events, socket} from '../client-lib/global.js';
	import {historyManager} from '../client-lib/history.js';
	import Vue from 'vue';

	export default {
		props: ['exams', 'accountType'],
		data: () => ({
			fullscreenExam: {
				active: false,
				animatingOut: false,
				animatingIn: false,
				examObj: {
					teacher: {}
				},
				examTakerActive: false,
				styles: {},
				questions: []
			},
			loadedExamTaker: false
		}),
		methods: {
			percentage,
			getParentUntilMatches,
			async openExam(event, examObj) {
				const fse = $('fullscreen-exam');
				let delay = 50;
				let examElt = this.getParentUntilMatches(event.target, '.exam');
				let bounds = examElt.getBoundingClientRect();
				fse.classList.add('no-transition');
				['top', 'left', 'width', 'height'].forEach(property => {
					this.fullscreenExam.styles[property] = bounds[property] + 'px';
				});
				this.$forceUpdate();
				this.fullscreenExam.examObj = examObj;
				fse.classList.add('animating-in');
				historyManager.pushState('fullscreen-exam');
				preventScroll();
				await sleep(delay);
				fse.classList.remove('no-transition');
				fse.classList.add('active');
				events.emit('hideHeader');
				await sleep(200 - delay);
				fse.classList.remove('animating-in');
			},
			closeFullscreenExam: historyManager.backButtonCallable('fullscreen-exam', () => {
				const fse = $('fullscreen-exam');
				fse.classList.remove('active');
				fse.classList.add('animating-out');
				events.emit('showHeader');
				enableScroll();
				setTimeout(() => {
					fse.classList.remove('animating-out');
					// safari re-render hack
					fse.style.display = 'none';
					void fse.offsetWidth;
					fse.style.display = 'block';
				}, 300);
			}),
			startExam(exam) {
				this.fullscreenExam.examTakerActive = true;
				socket.emit('startExam', exam.examId);
			},
			closeExamTaker() {
				this.fullscreenExam.examTakerActive = false;
			},
			hostExam() {
				socket.emit('hostExam', this.fullscreenExam.examObj.examId);
			},
			unhostExam() {
				socket.emit('unhostExam', this.fullscreenExam.examObj.examId);
			}
		},
		socketHandlers: {
			updateExams(exams) {
				let newFse = exams.find(exam => exam.examId == this.fullscreenExam.examObj.examId && exam.examId !== undefined);
				if (newFse) this.fullscreenExam.examObj = newFse;
			},
			examQuestionsLoaded({examId, questions}) {
				if (examId == this.fullscreenExam.examObj.examId) {
					this.fullscreenExam.questions = questions;
				}
			}
		},
		async created() {
			if (this.accountType == 'student') {
				let ExamTaker = (await import('./ExamTaker.vue')).default;
				Vue.component('exam-taker', ExamTaker);
				this.loadedExamTaker = true;
			}
		}
	};
</script>