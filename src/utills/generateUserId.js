const getUserModel = require('../models/userModel'); // Import getUserModel

class UserIdGeneratorService {
  currentLetterCount = 4;
  currentDigitCount = 4;
  appInitial = '';

  constructor(appInitial) {
    this.appInitial = appInitial;
  }

  async fetchLastUserId() {
    try {
   // Log the User model
      const User = await getUserModel();
      const lastUser = await User.findOne().sort({ createdAt: -1 }).exec();
      if (lastUser) {
        return lastUser.userId;
      } else {
        return `${this.appInitial}-${'A'.repeat(this.currentLetterCount)}-${'0'.repeat(this.currentDigitCount)}`;
      }
    } catch (error) {
      console.error('Error fetching last user ID:', error);
      throw error;
    }
  }

  async generateUserId(conn) {
    const lastId = await this.fetchLastUserId();
    return this.generateId(lastId);
  }

  generateId(currentId) {
    let [appInitial, letters, numbers] = currentId.split('-');
    if (numbers.length === letters.length) {
      numbers = (parseInt(numbers) + 1).toString().padStart(numbers.length, '0');
      if (numbers.length > letters.length) {
        if (letters.split('').every(char => char === 'Z')) {
          letters = 'A'.repeat(letters.length + 1);
          numbers = '0'.repeat(letters.length);
        } else {
          letters = this.incrementLetters(letters);
          numbers = '0'.repeat(letters.length);
        }
      }
      return `${appInitial}-${letters}-${numbers}`;
    } else {
      throw new Error('Wrong pattern');
    }
  }

  incrementLetters(letters) {
    let arr_letters = letters.split('');
    let i = arr_letters.length - 1;
    while (i >= 0) {
      if (arr_letters[i] === 'Z') {
        arr_letters[i] = 'A';
        i--;
      } else {
        arr_letters[i] = String.fromCharCode(letters[i].charCodeAt(0) + 1);
        break;
      }
    }
    if (i < 0) {
      arr_letters.unshift('A');
    }
    return arr_letters.join('');
  }
}

module.exports = UserIdGeneratorService;