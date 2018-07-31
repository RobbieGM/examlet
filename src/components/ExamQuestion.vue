<template>
	<div>
		<strong :class='{"first-question": questionNumber == 1}'>{{questionNumber}}. {{ question.title }}</strong>
		<div v-if='question.type == "text"'>
			<input type='text' placeholder='Your answer' @change='setAnswer($event.target.value)'/>
		</div>
		<div v-if='question.type == "multiple-choice"'>
			<div v-for='(choice, choiceIndex) in question.choices' class='multiple-choice-option' :key='choiceIndex'>
				<input type='radio' :name='`q-${questionNumber}`' :value='choiceIndex' :id='`q-${questionNumber}-a-${choiceIndex}`' @click='setAnswer(choice)'/>
				<label :for='`q-${questionNumber}-a-${choiceIndex}`'>{{ choice }}</label>
			</div>
		</div>
		<div v-if='question.type == "true-or-false"' class='true-or-false'>
			<div :class='{"true": true, "selected": this.answer == "true"}' @click='setAnswer("true")'>True</div>
			<div :class='{"false": true, "selected": this.answer == "false"}' @click='setAnswer("false")'>False</div>
		</div>
	</div>
</template>

<style scoped lang='scss'>
@import '../css/variables';
@import '../css/input-styles';

strong {
	margin: 8px 0;
	display: block;
	&.first-question { margin-top: 0 }
}

.multiple-choice-option { margin: 4px 0 }

.true-or-false {
	font-size: 0;
	div {
		font-size: 1rem;
		display: inline-block;
		transition-duration: 0.2s;
		padding: 8px 16px;
		color: $accent2;
		border-radius: 3px;
		&.selected {
			background: $accent2;
			color: white;
		}
		&:not(.selected) { cursor: pointer }
	}
}
</style>

<script>
	export default {
		props: ['question', 'questionNumber'],
		data: () => ({
			answer: undefined
		}),
		methods: {
			setAnswer(answer) {
				this.answer = answer;
				this.$emit('answer-changed');
			}
		}
	};
</script>