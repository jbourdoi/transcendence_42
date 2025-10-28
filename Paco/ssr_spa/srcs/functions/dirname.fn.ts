let localDirname = ''

export function setDirName(newName: string) {
	localDirname = newName
}

export default function __dirname() {
	return localDirname
}
