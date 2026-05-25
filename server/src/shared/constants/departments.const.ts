export const DEFAULT_CITY_DEPARTMENTS = [
  {
    name: 'Пожежна служба',
    type: 'FIRE_SERVICE',
    description: 'Реагування на пожежі, задимлення та інші пожежні загрози.',
  },
  {
    name: 'ЖКГ та комунальні служби',
    type: 'UTILITIES',
    description: 'Вода, тепло, електрика, вивіз сміття, прибудинкові мережі.',
  },
  {
    name: 'Дорожня служба',
    type: 'ROAD_SERVICE',
    description: 'Ями, розмітка, освітлення доріг, зупинки та інфраструктура.',
  },
  {
    name: 'Поліція та громадська безпека',
    type: 'PUBLIC_SAFETY',
    description: 'Порушення громадського порядку та питання безпеки.',
  },
  {
    name: 'Екстрені та спецслужби',
    type: 'EMERGENCY_SPECIAL',
    description: 'Надзвичайні ситуації та координація зі спецслужбами.',
  },
  {
    name: 'Інше',
    type: 'OTHER',
    description: 'Інші звернення, що потребують ручної маршрутизації.',
  },
] as const;
