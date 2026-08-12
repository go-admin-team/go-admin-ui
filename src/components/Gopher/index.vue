<template>
  <!--
    Go Gopher
    形象由 Renée French 设计，以 CC BY 3.0 授权发布（https://go.dev/blog/gopher）。
    此处为按该形象重新绘制的矢量版本：不引入外部图片，可随品牌色调整、可做动效。
  -->
  <svg
    class="gopher"
    viewBox="0 0 200 270"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <!-- userSpaceOnUse：让身体、耳朵、手臂、眼皮共用同一条绝对渐变，
           眨眼时眼皮颜色才能和身体严丝合缝 -->
      <linearGradient id="gopherFur" gradientUnits="userSpaceOnUse" x1="100" y1="38" x2="100" y2="236">
        <stop offset="0" stop-color="#8FDFEE" />
        <stop offset="1" stop-color="#55BFD6" />
      </linearGradient>
      <radialGradient id="gopherShadow">
        <stop offset="0" stop-color="#020b17" stop-opacity="0.55" />
        <stop offset="1" stop-color="#020b17" stop-opacity="0" />
      </radialGradient>
      <clipPath id="gopherEyeL"><circle cx="70" cy="92" r="30" /></clipPath>
      <clipPath id="gopherEyeR"><circle cx="130" cy="92" r="30" /></clipPath>
    </defs>

    <!-- 接触阴影：与浮动同频反向缩放，是"站在地面上"的关键 -->
    <ellipse class="shadow" cx="100" cy="254" rx="66" ry="10" fill="url(#gopherShadow)" />

    <g class="bob" stroke="#0a1729" stroke-width="4.5" stroke-linejoin="round">
      <!-- 脚、手臂、耳朵先画，随后被身体覆盖交接处 -->
      <ellipse cx="64" cy="237" rx="22" ry="12" fill="#F2D3A7" transform="rotate(-12 64 237)" />
      <ellipse cx="136" cy="237" rx="22" ry="12" fill="#F2D3A7" transform="rotate(12 136 237)" />

      <ellipse cx="26" cy="158" rx="14" ry="26" fill="url(#gopherFur)" transform="rotate(18 26 158)" />
      <ellipse cx="174" cy="158" rx="14" ry="26" fill="url(#gopherFur)" transform="rotate(-18 174 158)" />

      <circle cx="62" cy="44" r="14" fill="url(#gopherFur)" />
      <circle cx="138" cy="44" r="14" fill="url(#gopherFur)" />

      <!-- 身体：顶部整半圆，底部小圆角，这是 gopher 的体态特征 -->
      <path
        d="M28 110a72 72 0 0 1 144 0v86a40 40 0 0 1-40 40H68a40 40 0 0 1-40-40Z"
        fill="url(#gopherFur)"
      />

      <!-- 眼睛：瞳孔统一偏左，视线落在左侧终端上 -->
      <circle cx="70" cy="92" r="30" fill="#fff" />
      <circle cx="130" cy="92" r="30" fill="#fff" />
      <circle cx="64" cy="97" r="12.5" fill="#0a1729" stroke="none" />
      <circle cx="124" cy="97" r="12.5" fill="#0a1729" stroke="none" />
      <circle cx="59" cy="92" r="4.2" fill="#fff" stroke="none" />
      <circle cx="119" cy="92" r="4.2" fill="#fff" stroke="none" />

      <!-- 眼皮：静止时下边缘正好压在眼眶顶部，向下位移 62 即完全闭合 -->
      <g clip-path="url(#gopherEyeL)">
        <rect class="lid" x="34" y="-2" width="72" height="64" fill="url(#gopherFur)" />
      </g>
      <g clip-path="url(#gopherEyeR)">
        <rect class="lid" x="94" y="-2" width="72" height="64" fill="url(#gopherFur)" />
      </g>

      <!-- 门牙：整块加一条分隔线，避免两个圆角矩形相接处描边打架 -->
      <rect x="86" y="114" width="28" height="28" rx="5" fill="#fff" />
      <path d="M100 114v28" stroke-width="3.5" />

      <!-- 口鼻：画在门牙之后，用弧线自然切掉牙齿上半段 -->
      <ellipse cx="100" cy="110" rx="18" ry="15" fill="#F2D3A7" />
      <ellipse cx="100" cy="104" rx="9.5" ry="7.5" fill="#5C3A1E" stroke="none" />
    </g>
  </svg>
</template>

<script>
export default {
  name: 'GoGopher'
}
</script>

<style lang="scss" scoped>
.gopher {
  display: block;
  width: 100%;
  height: auto;
}

.bob {
  animation: gopher-bob 4.4s ease-in-out infinite;
}

.shadow {
  // 显式声明 view-box，使 transform-origin 按 viewBox 用户单位解析
  transform-box: view-box;
  transform-origin: 100px 254px;
  animation: gopher-shadow 4.4s ease-in-out infinite;
}

.lid {
  animation: gopher-blink 5.6s infinite;
}

@keyframes gopher-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}

@keyframes gopher-shadow {
  0%, 100% { transform: scaleX(1); opacity: 1; }
  50%      { transform: scaleX(0.93); opacity: 0.72; }
}

// 约 5.6s 眨一次，闭合与睁开各约 140ms
@keyframes gopher-blink {
  0%, 91% { transform: translateY(0); }
  93.5%   { transform: translateY(62px); }
  96%     { transform: translateY(0); }
  100%    { transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .bob,
  .shadow,
  .lid { animation: none; }
}
</style>
