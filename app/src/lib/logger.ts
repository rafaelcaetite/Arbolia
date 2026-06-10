export class AppLogger {
  private static instance: AppLogger;

  // Construtor privado proíbe clientes de chamar new AppLogger()
  private constructor() {}

  // Método que retorna a instância única da classe
  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  public log(message: string) {
    console.log(`[INFO]: ${message}`);
  }
  
  public warn(message: string) {
    console.warn(`[WARN]: ${message}`);
  }

  public error(message: string, error?: unknown) {
    if (error) {
      console.error(`[ERROR]: ${message}`, error);
    } else {
      console.error(`[ERROR]: ${message}`);
    }
  }
}
