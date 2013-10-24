#modJS


## 简介
modJS是一套的前端模块加载解决方案。与传统的模块加载相比，modJS会根据产品实际使用场景，自动选择一种相应的方案，使最终的实现非常轻量简洁。

## 下载

[Latest release](https://raw.github.com/zjcqoo/mod/master/mod.js)

## 使用

**模块的定义**

* modJS完全遵循AMD规范。使用define来定义一个模块：

  **define** (id, factory)

  在平常开发中，我们只需写factory中的代码即可，无需手动定义模块。发布工具会自动将模块代码嵌入factory的闭包里。

 factory提供了3个参数：**require**, **exports**, **module**，用于模块的引用和导出。

* modJS的发布工具会保证你的程序在使用之前，所有依赖的模块都已加载。因此当我们需要一个模块时，只需提供一个模块名即可获取：

 **require** (id)

 和NodeJS里获取模块的方式一样，非常简单。

 因为所需的模块都已预先加载，因此require可以立即返回该模块。

* 考虑到有些模块无需在启动时载入，因此modJS提供了可以在运行时异步加载模块的接口：

 **require.async** (names, onload, onerror)

 names可以是一个模块名，或者是数组形式的模块名列表。

 当所有都加载都完成时，onload被调用，names对应的所有模块实例将作为参数传入。

 如果加载错误或者网络超时，onerror将被触发。

 超时时间可以通过require.timeout设置，默认为5000(ms)。

  使用require.async获取的模块不会被发布工具安排在预加载中，因此在完成回调之前require将会抛出模块未定义错误。


 **require.loadJs** (url)

 异步加载脚本文件，不做任何回调

 **require.loadCss** ({url: cssfile})

 异步加载CSS文件，并添加到页面

 **require.loadCss** ({content: csstext})

 创建一个样式列表并将css内容写入



## 相关项目

自动化框架：[fis](https://github.com/fis-dev/fis-postprocessor-jswrapper)

自动添加define插件：[fis-modular-reqlang](https://github.com/fouber/fis-modular-reqlang)