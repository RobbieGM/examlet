<template><div>
	<ExamContainer account-type='teacher' :exams='this.myExams'/>
</div></template>
<script>
	import {socket} from '../client-lib/global.js';
	import ExamContainer from './ExamContainer.vue';

	export default {
		props: ['user'],
		data: () => ({
			myExams: []
		}),
		socketHandlers: {
			updateExams(exams) {
				this.myExams = exams;
			}
		},
		mounted() {
			socket.emit('loadMyExams');
		},
		components: {ExamContainer}
	}
</script>