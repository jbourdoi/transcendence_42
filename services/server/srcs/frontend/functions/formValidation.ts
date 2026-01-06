export function hasInvalidFields(form: HTMLElement): boolean {
	return form.querySelectorAll('.invalid-field').length > 0
}

export function fieldInvalid(el: HTMLElement, message?: string) {
	el.classList.add('invalid-field')
	const parent = el.parentElement
	if (!parent) return
	let errorSpan = parent.querySelector('.field-error-message') as HTMLElement | null
	if (!errorSpan) {
		errorSpan = document.createElement('span')
		errorSpan.classList.add('field-error-message')
		parent.appendChild(errorSpan)
	}
	if (message) errorSpan.textContent = message
}

export function fieldValid(el: HTMLElement) {
	el.classList.remove('invalid-field')
	const parent = el.parentElement
	if (!parent) return
	const errorSpan = parent.querySelector('.field-error-message') as HTMLElement | null
	if (errorSpan) errorSpan.remove()
}

export function setupFieldValidation(input: HTMLInputElement, validator: (value: string) => boolean, errorMessage: string) {
	input.addEventListener('input', () => {
		if (validator(input.value)) fieldInvalid(input, errorMessage)
		else fieldValid(input)
	})
}

export function setupConfirmFieldValidation(
	originalInput: HTMLInputElement,
	confirmInput: HTMLInputElement,
	errorMessage: string
) {
	confirmInput.addEventListener('input', () => {
		if (confirmInput.value !== originalInput.value) fieldInvalid(confirmInput, errorMessage)
		else fieldValid(confirmInput)
	})
}

export function setupUsernameAndPwdFieldsValidation($form: HTMLElement) {
	setupFieldValidation(
		$form.querySelector('input[name="username"]') as HTMLInputElement,
		(value: string) => value.trim() === '',
		'Empty field'
	)
	setupFieldValidation(
		$form.querySelector('input[name="pwd"]') as HTMLInputElement,
		(value: string) => value.trim() === '',
		'Empty field'
	)
}

export function setupAllFieldValidation($form: HTMLElement) {
	setupFieldValidation(
		$form.querySelector('input[name="username"]') as HTMLInputElement,
		isUsernameFormatInvalid,
		'Username must be between 4 and 20 characters long and contain only letters, numbers and underscores'
	)
	setupFieldValidation(
		$form.querySelector('input[name="email"]') as HTMLInputElement,
		isEmailFormatInvalid,
		'Invalid email format'
	)
	const $emailField = $form.querySelector('input[name="email"]') as HTMLInputElement
	const $confirmEmailField = $form.querySelector('input[name="checkmail"]') as HTMLInputElement
	setupFieldValidation($confirmEmailField, (value: string) => value !== $emailField.value, 'Emails do not match')
	setupFieldValidation(
		$form.querySelector('input[name="pwd"]') as HTMLInputElement,
		isPwdFormatInvalid,
		'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character'
	)
	const $passwordField = $form.querySelector('input[name="pwd"]') as HTMLInputElement
	const $confirmPasswordField = $form.querySelector('input[name="checkpwd"]') as HTMLInputElement
	setupFieldValidation($confirmPasswordField, (value: string) => value !== $passwordField.value, 'Passwords do not match')
}

export function resetAvatarButton(resetBtn: HTMLButtonElement, avatarInput: HTMLInputElement, avatarPreview: HTMLImageElement) {
	resetBtn.addEventListener('click', () => {
		avatarPreview.src = '/images/avatars/baseAvatar.jpg'
		avatarInput.value = ''
	})
}

export function setupAvatarPreview(avatarInput: HTMLInputElement, avatarPreview: HTMLImageElement) {
	avatarInput.value = ''
	avatarPreview.src = '/images/avatars/baseAvatar.jpg'

	let avatarObjectURL: string | null = null
	avatarInput.addEventListener('change', () => {
		const file = avatarInput.files?.[0] || null
		if (isAvatarFileFormatInvalid(file)) {
			fieldInvalid(avatarInput, 'Avatar file must be an image and less than 100 KB')
			avatarInput.value = ''
			return
		} else fieldValid(avatarInput)
		if (avatarObjectURL) {
			URL.revokeObjectURL(avatarObjectURL)
			avatarObjectURL = null
		}
		if (file) {
			avatarObjectURL = URL.createObjectURL(file)
			avatarPreview.src = avatarObjectURL
		}
	})
}

export function isUsernameFormatInvalid(username: string): boolean {
	if (username.length < 4) return true
	if (username.length > 20) return true
	if (!/^[a-zA-Z0-9_]+$/.test(username)) return true
	return false
}

export function isEmailFormatInvalid(email: string): boolean {
	if (!email.includes('@')) return true
	if (!email.includes('.')) return true
	if (email.lastIndexOf('.') < email.indexOf('@')) return true
	if (email.indexOf('@') === 0) return true
	if (email.lastIndexOf('.') === email.length - 1) return true
	if (email.indexOf('.') - email.indexOf('@') === 1) return true
	if (email.length > 320) return true
	return false
}

export function isPwdFormatInvalid(pwd: string): boolean {
	if (pwd.length < 8) return true
	if (!pwd.match(/[a-z]/)) return true
	if (!pwd.match(/[A-Z]/)) return true
	if (!pwd.match(/[0-9]/)) return true
	if (!pwd.match(/[\W_]/)) return true
	return false
}

export function isAvatarFileFormatInvalid(avatarFile: File | null): boolean {
	if (avatarFile && avatarFile.size > 100 * 1024) {
		return true
	}
	if (avatarFile && !avatarFile.type.startsWith('image/')) {
		return true
	}
	return false
}

export function createFormData(form: HTMLElement, avatarInput: HTMLInputElement): FormData {
	const formData = new FormData()
	formData.append('username', (form.querySelector('input[name="username"]') as HTMLInputElement).value)
	formData.append('email', (form.querySelector('input[name="email"]') as HTMLInputElement).value)
	formData.append('checkmail', (form.querySelector('input[name="checkmail"]') as HTMLInputElement).value)
	formData.append('pwd', (form.querySelector('input[name="pwd"]') as HTMLInputElement).value)
	formData.append('checkpwd', (form.querySelector('input[name="checkpwd"]') as HTMLInputElement).value)
	const avatarFile: File | null = avatarInput.files?.[0] || null
	if (avatarFile) formData.append('avatar', avatarFile)
	else formData.append('avatar', '')

	return formData
}

export function createLoginFormData(form: HTMLElement): FormData {
	const formData = new FormData()
	formData.append('username', (form.querySelector('input[name="username"]') as HTMLInputElement).value)
	formData.append('email', (form.querySelector('input[name="email"]') as HTMLInputElement).value)
	formData.append('checkmail', (form.querySelector('input[name="checkmail"]') as HTMLInputElement).value)
	formData.append('pwd', (form.querySelector('input[name="pwd"]') as HTMLInputElement).value)
	formData.append('checkpwd', (form.querySelector('input[name="checkpwd"]') as HTMLInputElement).value)

	return formData
}
