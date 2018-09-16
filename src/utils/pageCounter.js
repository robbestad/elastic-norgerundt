function counter(i, max = 10) {
	const start = i * max;
	return (start - (max-1)) >= 0 ? start - (max-1) : (start - 1) >= 0 ? (start - 1) : 0
}

module.exports = function count(input, max = 10) {
	const startCount = counter(input, max) - 1;
	const endCount = startCount + (max - 1);
	return {startCount, endCount};
};
