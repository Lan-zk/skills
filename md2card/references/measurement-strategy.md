# 浏览器测量策略

md2card 使用浏览器测量作为分页依据，而不是字符数估算。

---

## 为什么不用字符数估算

1. 中文、英文、数字、标点宽度不同
2. 比例字体不是等宽字体
3. 粗体与普通字宽度不同
4. 行内代码使用等宽字体
5. 列表有缩进与编号宽度
6. 引用块有内边距
7. 代码块有独立样式
8. 图片占位高度不固定
9. **浏览器真实换行结果才是最终显示结果**

---

## 测量容器要求

测量容器是一个隐藏的 DOM 元素：

```html
<div id="measure-container"></div>
```

样式要求：

```css
#measure-container {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 1066px;  /* pageWidth - paddingLeft - paddingRight */
  font-family: sans-serif;
  font-size: 36px;
  line-height: 1.6;
  overflow: hidden;
  white-space: pre-wrap;
  word-wrap: break-word;
}
```

---

## 测量流程

1. **创建容器**：初始化时创建 `#measure-container`
2. **设置内容**：将待测内容写入容器的 `innerHTML`
3. **读取高度**：读取 `container.scrollHeight`
4. **清空容器**：准备下一次测量

---

## 二分查找算法

对于可拆分的内容（如段落），使用二分查找找到最大可容纳前缀：

```typescript
async findMaxFragment(
  inlines: Inline[],
  maxHeight: number
): Promise<{ fit: Fragment; rest: Inline[] }> {
  const tokens = flattenInlines(inlines)
  let low = 0
  let high = tokens.length

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const prefix = tokens.slice(0, mid)
    const html = tokensToHtml(prefix)
    const height = await measureHtmlHeight(html)

    if (height <= maxHeight) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  // 处理标签闭合...
  return { fit, rest }
}
```

---

## 代码块按行拆分

代码块按换行符拆分为行数组，然后二分查找最大可容纳行数：

```typescript
async splitCodeByLines(
  code: { language?: string; value: string },
  maxHeight: number
): Promise<{ fit: Fragment; rest: Inline[] }> {
  const lines = code.value.split('\n')
  let low = 0
  let high = lines.length

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const prefixLines = lines.slice(0, mid)
    const html = codeToHtml(prefixLines)
    const height = await measureHtmlHeight(html)

    if (height <= maxHeight) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return {
    fit: { type: 'code', language: code.language, value: lines.slice(0, low).join('\n') },
    rest: [{ type: 'text', value: lines.slice(low).join('\n') }],
  }
}
```

---

## 性能优化

1. **缓存测量结果**：相同内容的多次测量可缓存
2. **预热浏览器**：初始化时执行一次空测量预热
3. **批量测量**：在分页前先收集所有需要测量的内容

---

## Playwright 测量 API

```typescript
async measureHtmlHeight(html: string): Promise<number> {
  return page.evaluate((htmlContent: string) => {
    const container = document.querySelector('#measure-container')
    if (!container) return 0
    container.innerHTML = htmlContent
    return container.scrollHeight
  }, html)
}
```
