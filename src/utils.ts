// deep log objects without any [Object...]
// biome-ignore lint/suspicious/noExplicitAny: <deep log any>
export const deepLog = (obj: any) => {
	console.log(JSON.stringify(obj, null, 2))
}
