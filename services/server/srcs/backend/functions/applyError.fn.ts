type ErrorEntry = {
	message: string
}

const errors: Record<number, ErrorEntry> = {
	404: { message: 'Page not found' }
}

export async function applyError(pageContent: string, errorCode: number): Promise<string> {
	const errorMessage = errors[errorCode]?.message ?? 'Unknown error'

	return pageContent.replaceAll('{{error}}', String(errorCode)).replaceAll('{{errorMessage}}', errorMessage)
}
