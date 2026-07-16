function createMoodCalendarSurveyForm() {
  const form = FormApp.create("마음 캘린더 사용자 경험 설문");

  form.setDescription(
    "마음 캘린더를 사용해본 분들의 경험을 듣기 위한 설문입니다. " +
      "답변은 앱의 사용성, 가족 공유, 감정 기록, 개인정보 보호 기능을 개선하는 데 사용됩니다. " +
      "예상 소요 시간은 3~5분입니다."
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage("응답해 주셔서 감사합니다. 마음 캘린더를 더 안전하고 따뜻하게 개선하는 데 사용하겠습니다.");

  form.addMultipleChoiceItem()
    .setTitle("1. 마음 캘린더를 어떤 입장에서 사용하셨나요?")
    .setChoiceValues(["아이 본인", "부모/보호자", "아이와 부모가 함께", "선생님/상담자", "기타"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("2. 얼마나 사용해 보셨나요?")
    .setChoiceValues([
      "처음 열어보기만 했다",
      "1~2번 기록해 봤다",
      "3일 이상 기록해 봤다",
      "1주 이상 사용해 봤다",
      "가족방/동기화까지 사용해 봤다",
    ])
    .setRequired(true);

  addScaleQuestion(form, "3. 처음 앱을 봤을 때 무엇을 하는 앱인지 이해하기 쉬웠나요?", "전혀 아님", "매우 쉬움");
  addScaleQuestion(form, "4. 감정 선택 과정은 쉬웠나요?", "어렵다", "쉽다");
  addScaleQuestion(form, "5. 감정 이름과 이모지가 아이에게 이해하기 쉬웠나요?", "전혀 아님", "매우 쉬움");

  form.addParagraphTextItem()
    .setTitle("5-1. 어렵거나 헷갈린 감정 이름이 있었다면 적어주세요.")
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle("6. 기록하기 화면에서 가장 좋았던 기능은 무엇인가요? 복수 선택 가능")
    .setChoiceValues([
      "감정 여러 개 선택",
      "메모 질문/도움말",
      "사진 추가",
      "저장/수정 완료 문구",
      "아이별 사용자 선택",
      "아직 잘 모르겠다",
    ])
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle("7. 사용하면서 불편하거나 헷갈렸던 부분은 무엇인가요?")
    .setHelpText("예: 어디를 눌러야 할지 모르겠어요, 저장됐는지 헷갈렸어요, 글씨가 작아요 등")
    .setRequired(false);

  addScaleQuestion(form, "8. 캘린더에서 지난 기록을 다시 보는 경험은 어땠나요?", "불편함", "편리함");
  addScaleQuestion(form, "9. 리포트/통계 화면이 아이의 마음을 이해하는 데 도움이 되었나요?", "도움 안 됨", "매우 도움");

  form.addParagraphTextItem()
    .setTitle("9-1. 리포트에서 더 보고 싶은 내용이 있다면 적어주세요.")
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("10. 가족방/Google 로그인/초대 링크 기능을 사용해 보셨나요?")
    .setChoiceValues([
      "사용해 봤고 이해하기 쉬웠다",
      "사용해 봤지만 어려웠다",
      "기능은 봤지만 아직 사용하지 않았다",
      "어디에 있는지 몰랐다",
    ])
    .setRequired(true);

  addScaleQuestion(
    form,
    "11. 가족방 기록이 암호화되어 개발자도 내용을 볼 수 없다는 설명이 신뢰감을 주나요?",
    "전혀 아님",
    "매우 신뢰됨"
  );

  form.addMultipleChoiceItem()
    .setTitle("12. 현재 사진이 이 기기/브라우저에만 저장된다는 점을 어떻게 느끼시나요?")
    .setChoiceValues([
      "개인정보 보호에 좋아서 괜찮다",
      "다른 기기에서도 보여야 해서 아쉽다",
      "설명이 더 필요하다",
      "사진 기능을 사용하지 않는다",
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle("13. 앞으로 꼭 추가되면 좋겠는 기능은 무엇인가요? 최대 3개 선택")
    .setHelpText("가능하면 최대 3개만 골라주세요.")
    .setChoiceValues([
      "기록 알림/리마인더",
      "부모용 주간 리포트",
      "아이와 대화할 질문 추천",
      "암호화된 사진 클라우드 저장",
      "감정 카드/캐릭터 꾸미기",
      "학교/상담용 공유 리포트",
      "홈 화면 앱 설치/PWA",
    ])
    .setRequired(false);

  addScaleQuestion(form, "14. 마음 캘린더를 다른 가족이나 친구에게 추천하고 싶나요?", "전혀 아님", "매우 추천");

  form.addParagraphTextItem()
    .setTitle("15. 마지막으로, 마음 캘린더가 더 좋아지기 위해 꼭 바뀌었으면 하는 점을 자유롭게 적어주세요.")
    .setHelpText("좋았던 점, 아쉬운 점, 아이가 한 말, 부모 입장에서 필요한 점 등을 자유롭게 적어주세요.")
    .setRequired(false);

  Logger.log("편집 링크: " + form.getEditUrl());
  Logger.log("응답 링크: " + form.getPublishedUrl());
}

function addScaleQuestion(form, title, lowLabel, highLabel) {
  form.addScaleItem()
    .setTitle(title)
    .setBounds(1, 5)
    .setLabels(lowLabel, highLabel)
    .setRequired(true);
}
