<template>
	<div :class='{ fullscreen, "exam-taker": true, "graded": graded }'>
		<div class='top-bar'>
			<ProgressBar :amount='progress'></ProgressBar>
			<div class='title-bar'>
				<span class='material-icons close-button light-text' @click='stopExam'>close</span>
			</div>
		</div>
		<h3 class='sticky-title'>{{exam.name}}</h3>
		<div class='questions'>
			<ExamQuestion v-for='(question, index) in questions' :key='question.title' :question='question' :question-number='index + 1' @answer-changed='updateProgress'></ExamQuestion>
			<button @click='handIn' class='hand-in'>Hand in</button>
		</div>
		<div class='scores-container'>
			<div class='scores' v-if='graded'>
				<div>
					<div class='big'>{{percentage(fractionCorrect)}}%</div>
					<div class='label'>Percent</div>
				</div>
				<div>
					<div class='big'>{{score}}/{{questions.length}}</div>
					<div class='label'>Score</div>
				</div>
				<div>
					<div class='big'>{{letterGrade(fractionCorrect)}}</div>
					<div class='label'>Grade</div>
				</div>
			</div>
			<div v-if='graded' class='quip' v-html='quip'></div>
			<button @click='stopExam' class='finish'>Finish</button>
		</div>
	</div>
</template>

<style lang='scss' scoped>
@import '../css/variables';

.exam-taker {
	overflow-y: auto;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	transform-origin: center;
	transform: translateY(100%);
	box-shadow: none;
	transition: all 0.3s ease-in;
	background: $bkg-light;
	&.fullscreen {
		transform: none;
		transition: all 0.3s ease-out;
		box-shadow: 0 0 50px rgba(0, 0, 0, 0.2);
	}
}

.top-bar {
	position: fixed;
	width: 100%;
	height: calc(56px + 4px);
	.title-bar {
		background: rgba($bkg-light, 0.95);
		height: 56px;
		position: relative;
		justify-content: center;
		* {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
		}
	}
}

.sticky-title {
	position: sticky;
	top: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 56px;
	margin: 60px 56px 0 56px;
	z-index: 0;
}

.close-button {
	position: absolute;
	top: 0;
	left: 0;
	cursor: pointer;
	transition: color 0.2s ease-out;
	padding: 16px;
	&:active, &.held-down {
		color: $text;
		transition: none;
	}
}

.questions {
	position: absolute;
	z-index: -1;
	width: calc(100vw - 56px - 56px);
	margin: 0 56px;
}

.exam-taker.graded .questions, .exam-taker.graded h3.sticky-title {
	transition: all 0.2s $ease;
	transform: translateX(-20px);
	opacity: 0;
}

.scores-container {
	position: fixed;
	z-index: -1;
	margin: 0;
	top: calc(56px + 4px);
	transition: transform 0.2s $ease, opacity 0.2s $ease;
	transform: translateX(20px);
	opacity: 0;
}

.exam-taker.graded .scores-container {
	opacity: 1;
	transform: none;
}

.hand-in {
	display: block;
	margin: 8px auto;
}

.scores {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	width: 100vw;
	& > div {
		margin: 0 16px;
		text-align: center;
		.big {
			font-size: 2.5em;
		}
		.label {
			color: $text-light;
			text-transform: uppercase;
		}
	}
}

.finish {
	display: block;
	margin: 0 auto;
}
</style>
<!--not scoped--><style lang='scss'>
.quip {
	font-style: italic;
	text-align: center;
	margin: 32px 16px;
	.emoji { font-style: normal }
}
</style>

<script>
	import ProgressBar from './ProgressBar.vue';
	import ExamQuestion from './ExamQuestion.vue';
	import {socket, percentage} from '../client-lib/global.js';

	export default {
		props: ['questions', 'fullscreen', 'exam'],
		data: () => ({
			progress: 0,
			graded: false,
			quip: 'See you next test!'
		}),
		methods: {
			percentage,
			stopExam() {
				this.$emit('close-exam-taker');
			},
			getResponses() {
				return this.$children.filter(child => !!child.question /* exclude progress bar */).map(child => child.answer);
			},
			questionsAnswered() {
				const boolToNumber = x => x ? 1 : 0;
				return this.getResponses().map(answer => !!answer).map(boolToNumber).reduce((a, b) => a + b);
			},
			updateProgress() {
				this.progress = this.questionsAnswered() / this.questions.length;
			},
			async handIn() {
				let questionsLeft = this.questions.length - this.questionsAnswered();
				if (questionsLeft > 0) {
					let choice = await this.$root.showDialog(`You still have ${questionsLeft} questions unanswered on your test. Are you sure you want to hand it in?`, ['Cancel', 'OK']);
					if (choice == 'Cancel') return;
				}
				socket.emit('handIn', {
					examId: this.exam.examId,
					responses: this.getResponses()
				});
			},
			pickFromRanges(ranges, n, default_) {
				for (let key in ranges) {
					let r = ranges[key];
					if (n >= r[0] && n <= r[1]) {
						return key;
					}
				}
				return default_;
			},
			letterGrade(frac) {
				let percent = percentage(frac);
				var ranges = {
					'A': [93, 100],
					'A-': [90, 92],
					'B+': [87, 89],
					'B': [83, 86],
					'B-': [80, 82],
					'C+': [77, 79],
					'C': [73, 76],
					'C-': [70, 72],
					'D+': [67, 69],
					'D': [63, 66],
					'D-': [60, 62],
					'F': [0, 59]
				};
				return this.pickFromRanges(ranges, percent, '?');
			},
			getQuip(frac) {
				const quips = {
					'A': ['Aced it!', 'Amazing! <span class="emoji">👍</span>', 'Great score!', 'Wonderful! <span class="emoji">😇</span>'],
					'A-': ['Nice job <span class="emoji">👌</span>', 'Good job!', 'Pretty good!'],
					'B+': ['Not bad!', 'Not bad.', 'Pretty good.'],
					'B': ['Decent score', 'It\'ll do.', '<span class="emoji">😐</span>'],
					'B-': ['Good enough', 'Not too bad', 'You did okay'],
					'C+': ['Try harder next time', 'You can improve'],
					'C': ['Keep studying', 'Could\'ve been worse'],
					'C-': ['Not your best...', 'Keep trying'],
					'D+': ['Uh oh', 'Not good', 'Interesting try'],
					'D': ['<span class="emoji">💩</span>', 'What happened?', 'How did this happen?'],
					'D-': ['Barely passed that one', 'Dodged a bullet?', 'I guess it\'s a passing grade'],
					'F': ['RIP <span class="emoji">☠</span>', 'That was an F.', 'That better not happen again', 'Try to pass next time']
				};
				let quipsForGrade = quips[this.letterGrade(frac)];
				return quipsForGrade[Math.floor(Math.random() * quipsForGrade.length)];
			}
		},
		socketHandlers: {
			examGraded({examId, score}) {
				this.graded = true;
				this.progress = 1;
				if (examId == this.exam.examId) {
					this.score = score;
					this.fractionCorrect = this.score / this.questions.length;
					this.quip = this.getQuip(this.fractionCorrect);
				}
			}
		},
		components: {ProgressBar, ExamQuestion}
	};
</script>