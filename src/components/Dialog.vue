<script lang="ts">
import { ElDialog } from "element-plus"
import { defineComponent, ref, h, renderSlot } from "vue"
import { ElConfigProvider } from "element-plus"
import zhCn from "element-plus/es/locale/lang/zh-cn.mjs"

export default defineComponent({
  name: "ZlDialog",
  setup(props, { expose }) {
    let promise = null
    let _resolve: Function
    let _reject: Function
    const visible = ref(false)
    const confirmClose = ref(false)
    const _result = ref({})
    const open = () => {
      promise = new Promise((resolve, reject) => {
        _resolve = resolve
        _reject = reject
        visible.value = true
      })
      return promise
    }
    const close = (result?: any) => {
      confirmClose.value = true
      _result.value = result
      visible.value = false
    }
    const cancel = () => {
      confirmClose.value = false
      _result.value = {}
      visible.value = false
    }
    const handleClose = () => {
      if (confirmClose.value) {
        _resolve(_result.value)
      } else {
        _reject()
      }
    }
    expose({
      open,
      close,
      cancel,
    })
    return {
      open,
      close,
      cancel,
      handleClose,
      visible,
    }
  },
  render() {
    return h(
      ElConfigProvider,
      { locale: zhCn },
      {
        default: () =>
          h(
            ElDialog,
            {
              ...this.$attrs,
              modelValue: this.visible,
              onClose: this.handleClose,
              "onUpdate:modelValue": (val: boolean) => (this.visible = val),
            },
            {
              default: () => renderSlot(this.$slots, "default"),
              header: () => [
                renderSlot(this.$slots, "header"),
                renderSlot(this.$slots, "title"),
              ],
              footer: () => renderSlot(this.$slots, "footer"),
            },
          ),
      },
    )
  },
})
</script>
