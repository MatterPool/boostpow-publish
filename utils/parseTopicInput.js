function parseTopicInput(topic) {
	if (typeof topic === 'string' && topic.length > 0) {
		return topic;
	}
	return undefined;
}

export default parseTopicInput;
