const ptPT = {
  common: {
    back: 'Voltar',
    ok: 'OK',
    cancel: 'Cancelar',
    openSettings: 'Abrir Definições',
  },
  home: {
    title: 'O que está o teu bicho a pensar?',
    subtitle: 'Tira uma foto ao teu gato ou cão e descobre, finalmente, a verdade.',
    sampleThought: 'Mais uma foto? Cobro à hora.',
    takePhoto: 'Tirar foto',
    pickPhoto: 'Escolher da galeria',
    history_one: 'Ver a tua tradução',
    history_other: 'Ver as tuas {{count}} traduções',
  },
  permissions: {
    cameraTitle: 'Sem acesso à câmara',
    cameraBody: 'Para tirares uma foto ao teu animal, permite o acesso à câmara nas Definições.',
    photosTitle: 'Sem acesso às fotos',
    photosBody: 'Para escolheres uma foto do teu animal, permite o acesso às fotos nas Definições.',
    saveTitle: 'Sem acesso às fotos',
    saveBody: 'Para guardares a tradução no rolo da câmara, permite o acesso às fotos nas Definições.',
  },
  personality: {
    screenTitle: 'Personalidade',
    title: 'Quem é o teu bicho hoje?',
    subtitle: 'Escolhe a voz da tradução.',
    translate: 'Traduzir',
    pickFirst: 'Escolhe uma personalidade',
    selected: 'Selecionada',
  },
  result: {
    screenTitle: 'Tradução',
    loading: [
      'A ouvir os ronrons…',
      'A traduzir os latidos…',
      'A consultar o bigode…',
      'A interpretar o olhar de desprezo…',
    ],
    share: 'Partilhar',
    save: 'Guardar no rolo',
    saved: 'Guardada no rolo',
    moveBalloon: 'Mover balão',
    retryFree: 'Tentar outra vez · grátis',
    newPhoto: 'Nova foto',
    errorTitle: 'Algo correu mal',
    errorBody: 'Não conseguimos traduzir esta foto. Tenta outra vez.',
    shareUnavailable: 'A partilha não está disponível neste dispositivo.',
    notFound: 'Esta tradução já não existe.',
  },
  history: {
    screenTitle: 'As tuas traduções',
    emptyTitle: 'Ainda não traduziste nenhum bicho.',
    emptyBody: 'Tira a primeira foto e descobre o que ele anda a pensar.',
    emptyAction: 'Traduzir o primeiro',
  },
};

export default ptPT;
export type Strings = typeof ptPT;
