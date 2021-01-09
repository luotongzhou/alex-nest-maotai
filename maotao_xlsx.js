const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
var xlsx = require('node-xlsx')
const moment = require('moment') 

async function getMaotaiInfo(url) {
	return await axios.get(url).then(res => {
		const $ = cheerio.load(res.data)
		const table = $('.table_bg001')
			.eq(0)
			.find('tr')
		let i = 0
		// 找到对应的行数
		table.map((index, element) => {
			if (
				$(element)
					.text()
					.trim() === '净利润(扣除非经常性损益后)(万元)'
			) {
				i = index
			}
		})
		// 找到table 日期 与 利润 对应保存
		const trs = $('.scr_table').find('tr')
		const data = [
			{
				name: 'sheet1',
				data: []
			}
		]
		trs.map((index, el) => {
			if (index === 0 || index === i) {
				let tableData = []
				$(el)
					.find('td,th')
					.map((j, item) => {
						tableData.push($(item).text())
					})
				data[0].data.push(tableData)
			}
		})
		fs.writeFile(`茅台净利润${moment(new Date()).format('YYYY-MM-DD-hh:mm:ss')}.xlsx`, xlsx.build(data), 'utf-8', error => {
			if (!error) {
				console.log('数据爬取成功!')
			}
		})
	})
}

getMaotaiInfo('http://quotes.money.163.com/f10/zycwzb_600519.html#01c01')
