import text_to_picture from 'text-to-picture-kazari'
import random_letter from 'random-letter'

class CaptchaManager {
	captcha_lifetime: number
	captcha_result_map: Map<string, {
		correct_value_dirty: string
		correct_value_clean: string,
		end_of_life: number
	}> = new Map()

	constructor(captcha_lifetime: number) {
		this.captcha_lifetime = captcha_lifetime
	}

	check_captcha = (ip: string, value: string): boolean => 
		this.captcha_result_map.has(ip) &&
		this.captcha_result_map.get(ip)!!.end_of_life > Date.now() &&
		this.captcha_result_map.get(ip)!!.correct_value_clean == value
	get_captcha = async (ip: string): Promise<Buffer> => {
		let test_text: string
		let test_text_clean: string
		let end_of_life: number
		if (
			this.captcha_result_map.has(ip) &&
			this.captcha_result_map.get(ip)!!.end_of_life > Date.now()
		) {
			test_text = this.captcha_result_map.get(ip)!!.correct_value_dirty
			test_text_clean = this.captcha_result_map.get(ip)!!.correct_value_clean
			end_of_life = this.captcha_result_map.get(ip)!!.end_of_life
		} else {
			test_text = `${Math.round(Math.random() * 99)} ` +
			            `${random_letter()}` +
			            `${Math.round(Math.random() * 99)}` +
			            `${random_letter()} ${random_letter()}`
			test_text_clean = test_text.replace(/\s/g, '')
			end_of_life = Date.now() + this.captcha_lifetime
		}

		const result = await text_to_picture.convert({
			text: test_text
		})

		this.captcha_result_map.set(ip, {
			correct_value_dirty: test_text,
			correct_value_clean: test_text_clean,
			end_of_life: end_of_life
		})

		return (await result.getBuffer() as Buffer)
	}
}

export { CaptchaManager }
