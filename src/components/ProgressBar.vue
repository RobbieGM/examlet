<template>
	<div class='bar'>
		<div class='line' :style='getStyle()'></div>
	</div>
</template>

<style scoped lang='scss'>
@import '../css/variables';

.bar {
	background: $accent;
	height: 4px;
	overflow: hidden;
}
.line {
	background: $accent-dark;
	height: 100%;
	transition: width 0.2s $ease;
}
</style>

<script>
	export default {
		props: ['amount'],
		methods: {
			getStyle() {
				return {width: (100 * this.amount) + '%'}
			}
		}
	}
</script>