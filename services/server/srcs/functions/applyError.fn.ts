const errors = {
	404: {
		message: 'Page not found'
	}
}

export async function applyError(pageContent: string, error: number): Promise<string> {
	return new Promise(async (resolve, reject) => {
		pageContent = pageContent.replaceAll('{{error}}', String(error))
		pageContent = pageContent.replaceAll('{{errorMessage}}', errors[error].message)

		resolve(pageContent)
	})
}
