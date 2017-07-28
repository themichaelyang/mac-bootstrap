const readline = require('readline');

const stackLines = (...lines) => {
  let output = ''

  for (let i = 0; i < lines.length - 1; i++) {
    output += lines[i] + '\n'
  }
  output += lines[lines.length - 1]

  return output
}

const not = (boolean) => {
  return !boolean
}

const format = (string, data) => {
  return string.replace(/\{(.*?)\}/g, (match, submatch) => {
    return data[submatch]
  })
}

const createPromise = (handler) => {
  return new Promise(handler)
}

const isIntegerString = (string) => {
  return /^[0-9]*$/.test(string)
}

const main = () => {
  const commands = {
    'computer-name': stackLines('scutil --set ComputerName "{value}"',
               'scutil --set HostName "{value}"',
               'sudo scutil --set LocalHostName "{value}"',
               'sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName -string "{value}"'),
    'standby-delay': 'sudo pmset -a standbydelay {value}'
  }

  // const commands = {
  //   'computer-name': {
  //     cmd: stackLines('scutil --set ComputerName "{value}"',
  //              'scutil --set HostName "{value}"',
  //              'sudo scutil --set LocalHostName "{value}"',
  //              'sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName -string "{value}"'),
  //   }
  //   'standby-delay': {
  //     cmd: 'pmset -a standbydelay {value}',
  //     parser: () => {
  //
  //     }
  //   }
  // }

  const io = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => {
    return createPromise((resolve, reject) => {
      io.question(question, (answerString) => {
        resolve(answerString)
      })
    })
  }

  const prompt = (name, question) => {
    return ask(question).then((answer) => {
      if (answer === '') {
        console.log('Skipped.')
        return
      }
      else {
        // const answers = answerString.split(' ').map((string) => string.trim())
        const command = commands[name]
        // return [command, answers]
        return [command, answer]
      }
    })
  }

  const handleResponse = (name, question, transformAnswer, validator) => (response) => {
    // console.log(response)
    const [command, rawAnswer] = response
    const answer = transformAnswer(rawAnswer)

    if (validator(answer)) {
      console.log(format(command, { 'value': answer }))
    }
    else {
      console.log('Not a valid input, try again...')
      return qa(name, question, transformAnswer, validator)
    }
  }

  const qa = (name, question, transformAnswer = (a) => a.trim(), validator = (a) => true) => {
    return prompt(name, question)
           .then(handleResponse(name, question, transformAnswer, validator))
  }

  // const pipePromises = (...promises) => {
  //   let chained = promises[0]
  //
  //   for (let i = 1; i < promises.length; i++) {
  //     chained = chained.then(() => {
  //       return promises[i]
  //     })
  //   }
  //
  //   return chained
  // }

  console.log('Welcome to the .macos bootstrapping tool!')
  console.log('This tool will help you create a .macos file similar to: https://mths.be/macos')
  console.log('If you ever want to skip a step of the config, just hit return without entering any input.')

  // pipePromises(qa('computer-name', 'Set computer name: '),
              //  qa('standby-delay', 'Set standby delay: ', (hours) => hours * 60 * 60, isIntegerString))

  qa('computer-name', 'Set computer name: ')
  .then(() => qa('standby-delay', 'Set standby delay (in hours): ', (hours) => hours * 60 * 60, isIntegerString))

}

main()
