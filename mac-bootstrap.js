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

// actually checks if is decimal string with optional . leading 0 or 1
const isDecimalString = (string) => /^[0-1]\d*(\.\d+)?$/.test(string)

const secondsToHours = (hours) => hours.trim() * 60 * 60

const checkColorString = (string) => {
  let rgb = string.split(' ')

  return rgb.length === 3
      && rgb.reduce((acc, num) => acc && isDecimalString(num)
      && parseFloat(num) <= 1.0, true)
}

// wrap io.question in a Promise
const promptPromise = (question) => {
  return createPromise((resolve, reject) => {
    io.question(question, (answerString) => {
      resolve(answerString)
    })
  })
}

const prompt = (name, question, commands) => {
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

const handleResponse = (name, question, commands, transformAnswer, validator) => (response) => {
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
    return ask(name, question, commands, transformAnswer, validator)
  }
}

const ask = (name, question, commands, transformAnswer = (a) => a.trim(), validator = (a) => true) => {
  return prompt(name, question, commands)
         .then(handleResponse(name, question, commands, transformAnswer, validator))
}

// could try to use async / await?
const runSetup = (setupOrder, commands) => {
  // sequentially execute async asks
  setupOrder.reduce((acc, name) => {
    return acc.then(() => ask(name, commands[name].prompt, commands,
                              commands[name].transform, commands[name].validate))
  }, createEmptyPromise())
  .catch((err) => {
    console.log('Error! :-(')
    console.log(err)
  })
}

const main = () => {

  const commands = {
    'set-computer-name': {
      prompt: 'Set computer name: ',
      cmd:
`# Set computer name (as done via System Preferences → Sharing)
scutil --set ComputerName "{value}"
scutil --set HostName "{value}"
sudo scutil --set LocalHostName "{value}"
sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName -string "{value}"`
    },

    'set-standby-delay': {
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
    },

    'disable-transparency': {
      prompt: 'Disable transparency in the ui? (y/n): ',
      cmd:
`# Disable transparency in the menu bar and elsewhere
defaults write com.apple.universalaccess reduceTransparency -bool true`
    },

    'set-hightlight-color': {
      prompt: 'Set highlight color (input RGB as three space separated floats between 0.0 to 1.0): ',
      cmd:
`# Set highlight color to green
defaults write NSGlobalDomain AppleHighlightColor -string "{value}"`,
      validate: checkColorString
    }
  }

  console.log('Welcome to the .macos bootstrapping tool!')
  console.log('This tool will help you create a .macos file similar to: https://mths.be/macos')
  console.log('If you ever want to skip a step of the config, just hit return without entering any input (or enter "n").')

  const setupOrder = ['set-computer-name',
                      'set-standby-delay',
                      'disable-boot-sound',
                      'disable-transparency',
                      'set-hightlight-color']

  runSetup(setupOrder, commands)
}

main()
