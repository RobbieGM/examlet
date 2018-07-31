<template><div>
	<h1>Free, feature-packed quiz grading</h1>
	<div id='feature-container'>
		<div>
			<h3>Cheating Detection</h3>
			<p>Examlet detects tab flipping and app switching and tells the teacher about it. Don't worry, we won't take points off or give zeros automatically.</p>
		</div>
		<div>
			<h3>Instant Analytics</h3>
			<p>Teachers can see what questions are harder than others and which students perform better than others, even as the exam is in progress.</p>
		</div>
		<div>
			<h3>Fair Grading</h3>
			<p>Optionally, questions that a certain percentage of the students get wrong will not be graded. We can also grade on a curve, if desired.</p>
		</div>
		<div>
			<h3>Question Variety</h3>
			<p>We support lots of different types of questions, including:
				<ul>
					<li>Multiple choice (single solution)</li>
					<li>Multiple choice (multiple solutions)</li>
					<li>Short answer</li>
					<li>True/false</li>
					<li>Matching & ordering</li>
				</ul>
			</p>
		</div>
	</div>
	<h2>Get started</h2>
	<div style='text-align: center'>
		<p>It's as easy as signing into your school-provided Google account. We'll show you tests and quizzes from all the teachers in your school district, if you're a student.</p>
		<h3>Who are you?</h3>
		<button @click='signUp("student")'>A student</button>
		<button @click='signUp("teacher")'>A teacher</button>
	</div>
</div></template>

<style scoped lang='scss'>
@import '../css/variables';

#feature-container {
	display: flex;
	flex-wrap: wrap;
}

#feature-container > div {
	@include card;
	p {
		margin-bottom: 0;
	}
}
</style>

<script>
	import {signUp} from '../client-lib/gapi.js';
	export default {
		methods: {
			signUp
		}
	};
</script>