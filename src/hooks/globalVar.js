import { getCurrentInstance } from "vue";

export const useGlobalProperties = () => {
	const {appContext: { app: { config: { globalProperties }}}} = getCurrentInstance();
	return globalProperties;
}