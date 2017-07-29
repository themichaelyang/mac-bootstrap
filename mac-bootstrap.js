const readline = require('readline');

const io = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const stackLines = (...lines) => {
  let output = ''

  for (let i = 0; i < lines.length - 1; i++) {
    output += lines[i] + '\n'
  }
  output += lines[lines.length - 1]

  return output
}

const not = (boolean) => !boolean

const format = (string, data) => {
  return string.replace(/\{(.*?)\}/g, (match, submatch) => {
    return data[submatch]
  })
}

const createPromise = (handler) => new Promise(handler)

// used to start promise chain
const createEmptyPromise = () => createPromise((resolve) => resolve())

const isIntegerString = (string) => /^[0-9]*$/.test(string)

const secondsToHours = (hours) => hours * 60 * 60

// wrap io.question in a Promise
const promptPromise = (question) => {
  return createPromise((resolve, reject) => {
    io.question(question, (answerString) => {
      resolve(answerString)
    })
  })
}



const prompt = (name, question) => {
  return promptPromise(question).then((answer) => {
    if (answer === '' || answer === 'n') {
      console.log('Skipped.')
      return false
    }
    else {
      // const answers = answerString.split(' ').map((string) => string.trim())
      const command = commands[name].cmd
      // return [command, answers]
      return [command, answer]
    }
  })
}

const handleResponse = (name, question, transformAnswer, validator) => (response) => {
  // console.log(response)
  if (response === false) {
    return
  }

  const [command, rawAnswer] = response
  const answer = transformAnswer(rawAnswer)

  if (validator(rawAnswer.trim())) {
    console.log('ADDED:')
    console.log(format(command, { 'value': answer }))
    console.log('')
  }
  else {
    console.log('Not a valid input, try again...')
    console.log('')
    return ask(name, question, transformAnswer, validator)
  }
}

const ask = (name, question, transformAnswer = (a) => a.trim(), validator = (a) => true) => {
  return prompt(name, question)
         .then(handleResponse(name, question, transformAnswer, validator))
}

const commands = {
  'computer-name': {
    prompt: 'Set computer name: ',
    cmd:
`# Set computer name (as done via System Preferences → Sharing)
scutil --set ComputerName "{value}"
scutil --set HostName "{value}"
sudo scutil --set LocalHostName "{value}"
sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName -string "{value}"`
  },

  'standby-delay': {
    prompt: 'Set standby delay (in hours): ',
    cmd:
`# Set standby delay (default is 1 hour)
sudo pmset -a standbydelay {value}`,
    transform: secondsToHours,
    validate: isIntegerString
  },

  'disable-boot-sound': {
    prompt: 'Disable sound effects on boot? (y/n): ',
    cmd:
`# Disable the sound effects on boot
sudo nvram SystemAudioVolume=" "`
  }
}

const main = () => {

  console.log('Welcome to the .macos bootstrapping tool!')
  console.log('This tool will help you create a .macos file similar to: https://mths.be/macos')
  console.log('If you ever want to skip a step of the config, just hit return without entering any input (or enter "n").')

  // ask('computer-name', 'Set computer name: ')
  // .then(() => ask('standby-delay', 'Set standby delay (in hours): ',
        // secondsToHours, isIntegerString))
  // .then(() => ask('disable-boot-sound', 'Disable sound effects on boot? (y/n): '))

  const setupOrder = ['computer-name',
                      'standby-delay',
                      'disable-boot-sound']

  // sequentially execute async asks
  setupOrder.reduce((acc, name) => {
    return acc.then(() => ask(name, commands[name].prompt))
  }, createEmptyPromise())
}

main()
