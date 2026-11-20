export interface CreedText {
  label: string;
  title: string;
  body: string;
}

export const CREEDS: Record<'lord' | 'apostles', { name: string; texts: CreedText[] }> = {
  lord: {
    name: '주기도문',
    texts: [
      {
        label: '새번역',
        title: '주기도문 (The Lord’s Prayer) - 새번역',
        body: '하늘에 계신 우리 아버지,\n아버지의 이름을 거룩하게 하시며,\n아버지의 나라가 오게 하시며,\n아버지의 뜻이 하늘에서와 같이 땅에서도 이루어지게 하소서.\n오늘 우리에게 일용할 양식을 주시고,\n우리가 우리에게 잘못한 사람을 용서하여 준 것 같이 우리 죄를 용서하여 주시고,\n우리를 시험에 빠지지 않게 하시고,\n악에서 구하소서.\n나라와 권능과 영광이 영원히 아버지의 것입니다.\n아멘.',
      },
      {
        label: '구버전',
        title: '주기도문 (The Lord’s Prayer) - 구버전',
        body: '하늘에 계신 우리 아버지여\n이름이 거룩히 여김을 받으시오며\n나라이 임하옵시며\n뜻이 하늘에서 이룬 것 같이 땅에서도 이루어지이다.\n오늘날 우리에게 일용할 양식을 주옵시고\n우리가 우리에게 죄 지은 자를 사하여 준 것같이 우리 죄를 사하여 주옵시고\n우리를 시험에 들게 하지 마옵시고\n다만 악에서 구하옵소서.\n대개 나라와 권세와 영광이 아버지께 영원히 있사옵나이다.\n아멘.',
      },
      {
        label: '영문',
        title: 'The Lord’s Prayer (KJV, Matthew 6:9-13)',
        body: 'Our Father which art in heaven,\nHallowed be thy name.\nThy kingdom come,\nThy will be done in earth, as it is in heaven.\nGive us this day our daily bread.\nAnd forgive us our debts, as we forgive our debtors.\nAnd lead us not into temptation, but deliver us from evil:\nFor thine is the kingdom, and the power, and the glory, for ever.\nAmen.',
      },
    ],
  },
  apostles: {
    name: '사도신경',
    texts: [
      {
        label: '새번역',
        title: '사도신경 (The Apostles’ Creed) - 새번역',
        body: '나는 전능하신 아버지 하나님, 천지의 창조주를 믿습니다.\n나는 그의 유일하신 아들, 우리 주 예수 그리스도를 믿습니다.\n그는 성령으로 잉태되어 동정녀 마리아에게서 나시고,\n본디오 빌라도에게 고난을 받아 십자가에 못 박혀 죽으시고,\n장사된 지 사흘 만에 죽은 자 가운데서 다시 살아나셨으며,\n하늘에 오르시어 전능하신 아버지 하나님 우편에 앉아 계시다가,\n거기로부터 살아 있는 자와 죽은 자를 심판하러 오십니다.\n나는 성령을 믿으며,\n거룩한 공교회와 성도의 교제와\n죄를 용서받는 것과\n몸의 부활과 영생을 믿습니다.\n아멘.',
      },
      {
        label: '구버전',
        title: '사도신경 (The Apostles’ Creed) - 구버전',
        body: '전능하사 천지를 만드신 하나님 아버지를 내가 믿사오며,\n그 외아들 우리 주 예수 그리스도를 믿사오니,\n이는 성령으로 잉태하사 동정녀 마리아에게 나시고,\n본디오 빌라도에게 고난을 받으사, 십자가에 못 박혀 죽으시고,\n장사한 지 사흘 만에 죽은 자 가운데서 다시 살아나시며,\n하늘에 오르사, 전능하신 하나님 우편에 앉아 계시다가,\n저리로서 산 자와 죽은 자를 심판하러 오시리라.\n성령을 믿사오며,\n거룩한 공회와, 성도가 서로 교통하는 것과,\n죄를 사하여 주시는 것과,\n몸이 다시 사는 것과,\n영원히 사는 것을 믿사옵나이다.\n아멘.',
      },
      {
        label: '영문',
        title: 'The Apostles’ Creed',
        body: 'I believe in God, the Father almighty,\ncreator of heaven and earth.\nI believe in Jesus Christ, his only Son, our Lord.\nHe was conceived by the power of the Holy Spirit\nand born of the Virgin Mary.\nHe suffered under Pontius Pilate,\nwas crucified, died, and was buried.\nHe descended into hell.\nOn the third day he rose again.\nHe ascended into heaven,\nand is seated at the right hand of the Father.\nHe will come again to judge the living and the dead.\nI believe in the Holy Spirit,\nthe holy catholic Church,\nthe communion of saints,\nthe forgiveness of sins,\nthe resurrection of the body,\nand the life everlasting.\nAmen.',
      },
    ],
  },
};
