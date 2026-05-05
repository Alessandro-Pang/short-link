/**
 * 上下文风险词
 *
 * 这些词单独出现时容易误报，例如“产品和服务”会跨词命中“和服”。
 * 它们仍然是风险信号，但需要与更多上下文风险词或可疑词组合出现才拦截。
 */
export const CONTEXTUAL_RISK_KEYWORDS = `
	上门服务, 按摩服务, 保健按摩, 视频聊天,
	写真, 诱惑, 挑逗, 勾引, 撩人, 自拍,
	和服, 制服, 女仆装, 护士装,
	比基尼, 泳装, 内衣, 代理, 代理商,

	棋牌, 棋牌游戏, 棋牌室, 麻将, 斗地主, 德州扑克,
	竞技, 开奖, 中奖, 奖金, 大奖,
	大小单双, 单双, 对子, 顺子, 同花, 葫芦,

	投资理财, 数字货币, 虚拟币, 贷款,
	黑客, hack, hacker,
	手机定位, GPS定位, 实时定位,
	代办, 包过, 发票, 普通发票, 专用发票, 增值税发票,

	推广, 注册, 优惠, 活动,

	上門服務, 按摩服務, 寫真, 誘惑,
	女僕裝, 護士裝, 泳裝, 內衣,
	代理, 代理商, 單雙, 對子, 順子, 葫蘆,
	投資理財, 數字貨幣, 虛擬幣, 貸款,
	駭客, 手機定位, 實時定位,
	代辦, 包過, 發票, 普通發票, 專用發票, 增值稅發票,
	推廣, 註冊, 優惠, 活動,

	投資, FX, 仮想通貨, ビットコイン, 暗号資産,
	ハッカー,
	ゲーム, プラットフォーム, 公式, ダウンロード, アプリ,
	代理店, プロモーション, 登録, キャンペーン, 無料,
	制服, コスプレ, メイド, ナース, OL,

	affiliate, agent, referral, bonus,
	entertainment, game, gaming, platform, official, download, app,
	promotion, register, sign up, free,
	work from home, online job, side hustle,
	crypto trading, investment opportunity,
	hemp, pot, weed, acid, ice, dealer, pusher,
	high, wasted, trip, inject, injection, snort, snorting, smoke, smoking,
	pill, tablet, powder, crystal, rock, pipe, needle, spoon, foil,
	sexy, strip, webcam, gravure
`;
