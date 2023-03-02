<template>
    <a-modal :visible="visible"  :width="width" :footer="false" :maskClosable="false" @cancel="handleCancel">
        <template #title>{{ title }}</template>
        <a-row class="image-cropper-container">
            <img class="image-cropper-target" id="image-cropper-target" :src="originImageURL">
        </a-row>
        <div class="image-cropper-action">
            <a-button-group :disabled="!cropperIsReady">
                <a-button size="small" type="primary" title="上传" @click="upload">
                <template #icon>
                    <icon-upload/>
                </template>
                </a-button>
                <a-button size="small" type="primary" title="放大" @click="zoomIn">
                <template #icon>
                    <icon-zoom-in/>
                </template>
                </a-button>
                <a-button size="small" type="primary" title="缩小" @click="zoomOut">
                <template #icon>
                    <icon-zoom-out/>
                </template>
                </a-button>
                <a-button size="small" type="primary" title="向左转" @click="rotateLeft">
                <template #icon>
                    <icon-rotate-left/>
                </template>
                </a-button>
                <a-button size="small" type="primary" title="向右转" @click="rotateRight">
                <template #icon>
                    <icon-rotate-right/>
                </template>
                </a-button>
                <a-popover trigger="click">
                <a-button size="small" type="primary" title="预览" @click="preview">
                    <template #icon>
                    <icon-eye/>
                    </template>
                </a-button>
                <template #content>
                    <img :src="previewData" class="image-priview"/>
                </template>
                </a-popover>
            </a-button-group>
            <input type="file" ref="imageFileInput" accept="image/*" class="upload-input" @change="setImage"/>
            <a-button-group :disabled="!cropperIsReady" class="comfirm">
                <a-button size="small" @click="handleCancel">取消</a-button>
                <a-button size="small" type="primary" @click="handleConfirm">确认</a-button>
            </a-button-group>
        </div>
    </a-modal>
</template>

<script setup scoped>
import { toRefs, ref, getCurrentInstance, watch } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.min.css';
import { completionStatus } from '@codemirror/autocomplete';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: '修改头像'
    },
    width: {
        type:Number,
        default: 600
    },
    originImageURL: {
        type: String
    },
    //cropperjs options
    aspectRatio: {
        type: Number,
        default: 1 / 1
    },
    dragMode: {
        type: String,
        default: 'move'
    },
    autoCropArea: {
        type: Number,
        default: 0.5
    }
});

const emits = defineEmits(['cancel', 'confirm']);
const handleCancel = (e) => {
    emits('cancel');
}
const handleConfirm = () => {
    proxy.cropper.getCroppedCanvas().toBlob(data => {
        emits('confirm', data);
    });
}

const { visible, aspectRatio, dragMode, autoCropArea } = toRefs(props);
const { proxy } = getCurrentInstance();
const cropperIsReady = ref(false);
const imageFileInput = ref(null);
const previewData = ref('');

const zoomIn = () => {
    proxy.cropper.zoom(0.1);
}
const zoomOut = () => {
    proxy.cropper.zoom(-0.1);
}
const upload = () => {
    imageFileInput.value.click();
}
const rotateLeft = () => {
    proxy.cropper.rotate(-90);
}

const rotateRight = () => {
    proxy.cropper.rotate(90);
}

const preview = () => {
    const croppedData = proxy.cropper.getCroppedCanvas().toDataURL(); 
    previewData.value = croppedData;
}
const setImage = (e) => {
  const file = e.target.files[0];
      if (file.type.indexOf('image/') === -1) {
        throw Error('Please select an image file');
        return;
      }
      if (typeof FileReader === 'function') {
        const reader = new FileReader();
        reader.onload = (event) => {
            proxy.cropper.replace(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        throw Error('Sorry, FileReader API not supported');
      }
}
watch(visible, (value) => {
    if(value) {
        const cropperTarget = document.getElementById('image-cropper-target');
        proxy.cropper = new Cropper(cropperTarget, {
            aspectRatio: aspectRatio.value,
            dragMode: dragMode.value,
            autoCropArea: autoCropArea.value
        });
        cropperTarget.addEventListener('ready', () => {
            cropperIsReady.value = true;
        });
    } else {
        proxy.cropper && proxy.cropper.destroy();
        proxy.cropper = null;
    }
});

</script>

<style lang="scss" scoped>
.image-cropper-container {
    img {
        max-width: 100%;
    }
}
.image-cropper-action {
    padding-top: 15px;
    height:28px;
    .upload-input {
        display: none;
    }
    svg {
        font-size:28px;
    }
    .comfirm {
        float: right;
    }
}
.image-priview {
    width:80px;
    height:80px;
    border-radius: 80px;
}
</style>