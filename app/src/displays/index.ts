import { shallowRef, Ref } from 'vue';
import { DisplayConfig } from './types';

const displaysRaw: Ref<DisplayConfig[]> = shallowRef([]);
const displays: Ref<DisplayConfig[]> = shallowRef([]);

export function getDisplays(): { displays: Ref<DisplayConfig[]>; displaysRaw: Ref<DisplayConfig[]> } {
	return { displays, displaysRaw };
}
