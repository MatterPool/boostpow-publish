function parseCategoryInput (category) {
	if (typeof category === 'string' && category.length > 0) {
		return category;
	}
	return undefined;
}

export default parseCategoryInput;
