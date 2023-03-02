<template>
    <component :is="currentComponent"/>
</template>
<script setup>
import { computed } from 'vue';

const props = defineProps({
    name: String
});
const svgModules = import.meta.glob('@/icons/svg/*.svg', {
    eager: true
});
const currentComponent = computed(() => {
    const fileName = `/${props.name}.svg`;
    for (const path in svgModules) {
        const mod = svgModules[path];
        if(path.endsWith(fileName)) {
            return mod;
        }
    }
    throw new Error(`not found svg file: ${fileName}`);
});
</script>