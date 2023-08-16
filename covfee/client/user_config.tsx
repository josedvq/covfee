export function useUserConfig(scope: string) {
  const getConfig = (name: string, defaultValue: any = null) => {
    const val = localStorage.getItem(scope + "$" + name)
    if (val != null) return JSON.parse(val)
    else return defaultValue
  }

  const setConfig = (name: string, value: any) => {
    localStorage.setItem(scope + "$" + name, JSON.stringify(value))
  }

  const logConfig = () => {
    for (var i = 0, len = localStorage.length; i < len; ++i) {
      console.log(localStorage.getItem(localStorage.key(i)))
    }
  }

  return {
    getConfig,
    setConfig,
    logConfig,
  }
}

export type UserConfig = ReturnType<typeof useUserConfig>
