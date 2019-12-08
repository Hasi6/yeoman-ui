import {initComponent, destroy} from './Utils'
import App from '../src/App.vue';
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import { WebSocket } from 'mock-socket'
const flushPromises = require('flush-promises');

Vue.use(BootstrapVue)
global.WebSocket = WebSocket

let wrapper

describe('App.vue', () => {
  afterEach(() => {
    destroy(wrapper)
  })

  it('createPrompt - method', () => {
    wrapper = initComponent(App)
    expect(wrapper.vm.createPrompt()).toBeDefined()
  })

  describe('currentPrompt - computed', () => {
    it('questions are not defined', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{}, {}]
      wrapper.vm.promptIndex = 1
      expect(wrapper.vm.currentPrompt.answers).toEqual({})
    })

    it('questions are defined', () => {
      wrapper = initComponent(App)
      wrapper.vm.prompts = [{
          answers: {}, questions: []
        }, {
          answers: {name: 'test'}, 
          questions: [{name: 'q12', isWhen: true, answer: 'a12'}, {name: 'q22', isWhen: false, answer: 'a22'}]
      }]
      wrapper.vm.promptIndex = 1
      const testPrompt = wrapper.vm.currentPrompt
      expect(testPrompt.answers.q12).toBe('a12')
      expect(testPrompt.answers.q22).toBeUndefined()
    })
  })

  describe('currentPrompt.answers - watcher', () => {
    let invokeSpy
    beforeEach(() => {
      wrapper = initComponent(App)
      wrapper.vm.rpc = {
        invoke: () => Promise.resolve()
      }
      invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    })

    afterEach(() => {
      if (invokeSpy) {
        invokeSpy.mockRestore()
      }
    })

    test('invoke', () => {
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: 'defaultAnswer'
        }, {
          name: 'whenQ', when: '__Function', answer: 'whenAnswer'
        }, {
          name: 'messageQ', _message: '__Function', answer: 'messageAnswer'
        }, {
          name: 'choicesQ', _choices: '__Function', answer: 'choicesAnswer'
        }, {
          name: 'filterQ', filter: '__Function', answer: 'filterAnswer'
        }, {
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer'
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      const expectedAnswers = {
        "choicesQ": "choicesAnswer",
        "defaultQ": "defaultAnswer",
        "filterQ": "filterAnswer",
        "messageQ": "messageAnswer",
        "validateQ": "validateAnswer",
        "whenQ": "whenAnswer"
      }
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'defaultQ', 'default'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'whenQ', 'when'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'messageQ', 'message'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [[expectedAnswers], 'choicesQ', 'choices'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [['filterAnswer'], 'filterQ', 'filter'])
      expect(invokeSpy).toHaveBeenCalledWith('evaluateMethod', [['validateAnswer', expectedAnswers], 'validateQ', 'validate'])
    })

    test('invoke for question default, answer is defined', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue('defaultResponse')
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function', answer: 'defaultAnswer'
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].default).toBe('defaultResponse')
    })

    test('invoke for question default, answer is undefined', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue('defaultResponse')
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'defaultQ', _default: '__Function'
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].default).toBe('defaultResponse')
      expect(wrapper.vm.prompts[0].questions[0].answer).toBe('defaultResponse')
    })

    test('invoke for question validate , response is string', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue('validateResponse')
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer'
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].isValid).toBe(false)
      expect(wrapper.vm.prompts[0].questions[0].validationMessage ).toBe('validateResponse')
    })

    test('invoke for question validate , response is boolean', async () => {
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue(true)
      }
      wrapper.vm.prompts = [{ 
        questions: [{
          name: 'validateQ', validate: '__Function', answer: 'validateAnswer'
        }],
        answers: {}
     }]
      wrapper.vm.promptIndex = 0
      wrapper.vm.$options.watch["currentPrompt.answers"].handler.call(wrapper.vm)
      await flushPromises()
      expect(wrapper.vm.prompts[0].questions[0].isValid).toBe(true)
      expect(wrapper.vm.prompts[0].questions[0].validationMessage ).toBeUndefined()
    })
  })

  describe('setQuestionProps - method', () => {
    test('set props', () => {
      wrapper = initComponent(App)
      wrapper.vm.rpc = {
        invoke: jest.fn().mockResolvedValue()
      }
      const questions = [{
        name: 'defaultQ', default: '__Function', answer: 'defaultAnswer'
      }, {
        name: 'whenQ', when: '__Function', answer: 'whenAnswer'
      }, {
        name: 'messageQ', message: '__Function', answer: 'messageAnswer'
      }, {
        name: 'choicesQ', choices: '__Function', answer: 'choicesAnswer'
      }, {
        name: 'filterQ', filter: '__Function', answer: 'filterAnswer'
      }, {
        name: 'validateQ', validate: '__Function', answer: 'validateAnswer'
      }, {
        name: 'whenQ6', default: 'whenAnswer6', type: 'confirm'
      }]
      wrapper.vm.showPrompt(questions, 'promptName')
      expect(questions[0].default).toBeUndefined()
      expect(questions[0]._default).toBe('__Function')
      expect(questions[2].message).toBe('loading...')
      expect(questions[2]._message).toBe('__Function')
      expect(questions[3].choices).toEqual(['loading...'])
      expect(questions[3]._choices).toBe('__Function')

      expect(questions[1].answer).toBe('')
      expect(questions[1].isWhen).toBe(true)
      expect(questions[1].isValid).toBe(true)
      expect(questions[1].validationMessage).toBe(true)

      expect(questions[6].answer).toBe('whenAnswer6')
      expect(questions[6].isWhen).toBe(true)
      expect(questions[6].isValid).toBe(true)
      expect(questions[6].validationMessage).toBe(true)
    })
  })

  test('initRpc - method', () => {
    wrapper = initComponent(App)
    wrapper.vm.rpc = {
      invoke: jest.fn(),
      registerMethod: jest.fn()
    }

    
    wrapper.vm.showPrompt = jest.fn()
    wrapper.vm.setPrompts = jest.fn()
    wrapper.vm.generatorDone = jest.fn()
    wrapper.vm.log = jest.fn()

    const invokeSpy = jest.spyOn(wrapper.vm.rpc, 'invoke')
    const registerMethodSpy = jest.spyOn(wrapper.vm.rpc, 'registerMethod')
    wrapper.vm.initRpc();
    
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.showPrompt, thisArg: wrapper.vm, name: 'showPrompt'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.setPrompts, thisArg: wrapper.vm, name: 'setPrompts'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.generatorDone, thisArg: wrapper.vm, name: 'generatorDone'})
    expect(registerMethodSpy).toHaveBeenCalledWith({func: wrapper.vm.log, thisArg: wrapper.vm, name: 'log'})
    expect(invokeSpy).toHaveBeenCalledWith("receiveIsWebviewReady", [])
    
    invokeSpy.mockRestore()
    registerMethodSpy.mockRestore()
  })
})