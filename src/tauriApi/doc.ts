// 还原
export function resetChildren(children: any) {
  for (let i = 0; i < children.length; i++) {
    {
      const child = children[i]
      if (child.path) {
        // 如果是文档
        children[i] = child.path
      } else {
        if (child[i] instanceof Array) {
          children[i] = resetChildren(child[i])
        } else if (children[i].children) {
          children[i].children = resetChildren(children[i].children)
          // 删除id属性，此属性为编辑时临时标记
          delete children[i]["id"]
        }
      }
    }
  }
  return children
}
