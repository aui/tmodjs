template.helper('$ubb2html', function (content) {

	// 转义 HTML 字符
	content = template.helpers.$escape(content);

	// 解析 UBB 字符
    return content
    .replace(/\[b\]([^\[]*?)\[\/b\]/igm, '<b>$1</b>')
    .replace(/\[i\]([^\[]*?)\[\/i\]/igm, '<i>$1</i>')
    .replace(/\[u\]([^\[]*?)\[\/u\]/igm, '<u>$1</u>')
    .replace(/\[url=([^\]]*)\]([^\[]*?)\[\/url\]/igm, '<a href="$1">$2</a>')
    .replace(/\[img\]([^\[]*?)\[\/img\]/igm, '<img src="$1" />');
});