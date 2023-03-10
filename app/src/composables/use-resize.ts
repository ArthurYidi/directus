import { clamp } from 'lodash';
import { onMounted, ref, Ref, watch } from 'vue';

export type SnapZone = {
    snapPos: number;
    width: number;
    onSnap?: () => void;
    onPointerUp?: () => void;
}

export function useResize(
	target: Ref<HTMLElement | undefined>,
	minWidth: Ref<number>,
	maxWidth: Ref<number>,
	defaultWidth: Ref<number>,
	enabled: Ref<boolean> = ref(true),
    options?: Ref<{snapZones?: SnapZone[]}>
) {
	let dragging = false;
	let dragStartX = 0;
	let dragStartWidth = 0;
	let animationFrameID: number | null = null;

	let grabBar: HTMLDivElement | null = null;
	let wrapper: HTMLDivElement | null = null;

	const width = ref(defaultWidth.value);

	onMounted(() => {
		watch(
			enabled,
			(value) => {
				console.log('enabled changed', value);
				if (value) enable();
				else disable();
			},
			{ immediate: true }
		);
	});

	return { width };

	function enable() {
		if (!target.value) return;

		wrapper = document.createElement('div');
		wrapper.classList.add('resize-wrapper');

		target.value.parentElement!.insertBefore(wrapper, target.value);
		target.value!.style.width = `${defaultWidth.value}px`;
		wrapper.appendChild(target.value);

		grabBar = document.createElement('div');
		grabBar.classList.add('grab-bar');

		grabBar.onpointerenter = () => {
			if (grabBar) grabBar.classList.add('active');
		};

		grabBar.onpointerleave = () => {
			if (grabBar) grabBar.classList.remove('active');
		};

		grabBar.onpointerdown = onPointerDown;
		grabBar.ondblclick = resetWidth;

		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);

		wrapper.appendChild(grabBar);
	}

	function disable() {
		if (wrapper && grabBar) {
			if (target.value) {
				wrapper.parentElement!.insertBefore(target.value, wrapper);
			}

			grabBar.onpointerdown = null;
			grabBar.ondblclick = null;
			grabBar.onpointerenter = null;
			grabBar.onpointerleave = null;

			wrapper.parentElement!.removeChild(wrapper);
		}

		onPointerUp();

		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
	}

	function resetWidth() {
		width.value = defaultWidth.value;
		target.value!.style.width = `${defaultWidth.value}px`;
	}

	function onPointerDown(event: PointerEvent) {
		dragging = true;
		dragStartX = event.pageX;
		dragStartWidth = target.value!.offsetWidth;
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;

		animationFrameID = window.requestAnimationFrame(() => {
			const newWidth = clamp(dragStartWidth + (event.pageX - dragStartX), minWidth.value, maxWidth.value);

            const snapZones = options?.value.snapZones

            if (Array.isArray(snapZones)) {
                for (const zone of snapZones) {
                    if (Math.abs(newWidth - zone.snapPos) < zone.width) {
                        
                        target.value!.style.width = `${zone.snapPos}px`;
			            width.value = zone.snapPos;

                        if (zone.onSnap) zone.onSnap();
                        return;
                    }
                }
            }

			target.value!.style.width = `${newWidth}px`;
			width.value = newWidth;
		});
	}

	function onPointerUp() {
		if (dragging === true) {
			dragging = false;

            const snapZones = options?.value.snapZones

            if (Array.isArray(snapZones)) {
                for (const zone of snapZones) {
                    if (Math.abs(width.value - zone.snapPos) < zone.width) {
                        if (zone.onPointerUp) zone.onPointerUp();
                        break;
                    }
                }
            }

			if (animationFrameID) {
				window.cancelAnimationFrame(animationFrameID);
			}
		}
	}
}
