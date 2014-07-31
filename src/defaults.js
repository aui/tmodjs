module.exports = {

    // 模板根目录
    //base: './',

    // 编译输出目录设置
    output: './build',

    // 模板使用的编码。（只支持 utf-8）
    charset: 'utf-8',

    // 定义模板采用哪种语法，内置可选：
    // simple: 默认语法，易于读写。可参看语法文档
    // native: 功能丰富，灵活多变。语法类似微型模板引擎 tmpl
    syntax: 'simple',

    // 自定义辅助方法路径
    helpers: null,

    // 是否过滤 XSS
    // 如果后台给出的数据已经进行了 XSS 过滤，就可以关闭模板的过滤以提升模板渲染效率
    escape: true,

    // 是否压缩 HTML 多余空白字符
    compress: true,

    // 输出的模块类型，可选：
    // default:  模板目录将会打包后输出，可使用 script 标签直接引入，也支持 NodeJS/RequireJS/SeaJS。
    // cmd:         这是一种兼容 RequireJS/SeaJS 的模块（类似 atc v1版本编译结果）
    // amd:         支持 RequireJS 等流行加载器
    // commonjs:    编译为 NodeJS 模块
    type: 'default',

    // 设置输出的运行时文件名
    runtime: 'template.js',

    // 设置模块依赖的运行时路径
    // 仅针对于非``type:'default'``的模块配置字段。如果不指定模块内部会自动使用相对``runtime``的路径
    alias: null,

    // 是否合并模板
    // 仅针对于``type:'default'``的模块
    combo: true,

    // 是否输出为压缩的格式
    minify: true,

    // 是否开启编译缓存
    cache: true

};