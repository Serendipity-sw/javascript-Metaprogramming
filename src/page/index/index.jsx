import React from 'react';
import style from './index.pcss';
import 'reflect-metadata'

const ValidateType = {
  IsEmptyAndNullUndefined: Symbol('IsEmptyAndNullUndefined')
}

const Checked = (errorMessage, validateType = ValidateType.IsEmptyAndNullUndefined) => {
  return (target, propertyKey) => {
    if (Reflect.hasMetadata(target.constructor.name, target)) {
      let list = Reflect.getMetadata(target.constructor.name, target);
      list.push({
        key: propertyKey,
        errorMessage,
        validateType
      })
    } else {
      let list = [{
        key: propertyKey,
        errorMessage,
        validateType
      }];
      Reflect.defineMetadata(target.constructor.name, list, target);
    }
  }
}

const Form = validateType => {
  return (target, propertyKey) => {
    if (Reflect.hasMetadata(target.constructor.name, target, 'fromList')) {
      let list = Reflect.getMetadata(target.constructor.name, target, 'fromList');
      list.push({
        key: propertyKey,
        validateType
      })
    } else {
      let list = [{
        key: propertyKey,
        validateType
      }];
      Reflect.defineMetadata(target.constructor.name, list, target, 'fromList');
    }
  }
}

class Validate {
  #errorList = []

  #formList = []

  validate() {
    this.#errorList.length = 0
    Reflect.getMetadata(this.constructor.name, this).forEach(item => {
      this.#checkFactory(item.key, this[item.key], item.validateType, item.errorMessage)
    });
    return this.#errorList
  }

  formProcess(changeMethod, buttonClick) {
    this.#formList.length = 0
    Reflect.getMetadata(this.constructor.name, this, 'fromList').forEach(item => {
      this.#formFactory(item.key, item.validateType, changeMethod)
    });
    this.#formList.push(<button key={'button'} onClick={buttonClick}>提交</button>)
    return this.#formList
  }

  #formFactory(key, validateType, changeMethod) {
    switch (validateType) {
      case 'input:text':
        this.#formList.push(<div key={key}><span>{key}:</span><input type="text" value={this[key]} onChange={e => {
          changeMethod(e, key)
        }}/></div>)
        break
      case 'input:checkbox':
        this.#formList.push(<div key={key}><span>{key}:</span><input type="checkbox" value={this[key]} onChange={e => {
          changeMethod(e, key)
        }}/></div>)
        break
      default:
        break
    }
  }

  #checkFactory(key, value, validateType, errorMessage) {
    switch (validateType) {
      case ValidateType.IsEmptyAndNullUndefined:
        if (!value?.trim()) {
          this.#errorList.push(`${key}${errorMessage}`)
        }
        break;
      default:
        break;
    }
  }
}

class FormData extends Validate {
  @Checked('不能为空')
  @Form('input:text')
  name
  @Form('input:checkbox')
  age
  @Checked('不能为空')
  @Form('input:text')
  sex

  constructor({name, age, sex}) {
    super();
    this.name = name
    this.age = age
    this.sex = sex
  }
}

class Index extends React.Component {
  #data = new FormData({name: '', age: '', sex: ''})

  #handler = {
    get: (target, name) => {
      return name in target ? target[name] : 42;
    },
    set: (target, name, value) => {
      if (value === 1) {
        console.log('不允许赋值')
        return Reflect.set(target, name, '')
      } else {
        return Reflect.set(target, name, value)
      }
    }
  }

  componentDidMount() {
    let p = new Proxy({}, this.#handler)
    p.a = 1
    console.log(p.a, p.b)
    this.#data.validate()
  }

  #onChange = (e, key) => {
    this.#data[key] = e.target.value
    this.forceUpdate()
  }

  #dataSave = _ => {
    let errorMessage = this.#data.validate()
    if (errorMessage.length) {
      alert(errorMessage[0])
    } else {
      alert('提交成功')
    }
  }

  render() {
    return (
      <div className={style.home}>
        {
          this.#data.formProcess(this.#onChange, this.#dataSave)
        }
      </div>
    );
  }
}

export default Index;
