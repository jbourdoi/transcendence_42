export function json_parse(json: any): Object | undefined {
	try {
		const obj = JSON.parse(json)
		return obj
	} catch (e) {
		console.error('json_parse: ', e)
		return undefined
	}
}

export function json_stringify(obj: Object): string {
	return JSON.stringify(obj)
}
