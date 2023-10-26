type Handle = () => Promise<string>

const name: string = 'Le Minh Tuan'

const handle: Handle = () => {
  return Promise.resolve(name)
}

handle().then((res) => {
  console.log(res);

})