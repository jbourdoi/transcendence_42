export default function parse(data: any) {
	try {
		const value = JSON.parse(data)
		return value
	} catch (e) {
		return undefined
	}
}
