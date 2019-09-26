### Что это?
Это тестовое задание от evolution gaming. Которое спустя месяц так и не посмотрели. 

Формулировка задачи: "Your task is to solve all levels of the game available at https://hometask.eg1236.com/game1/

Your deliverable should contain two parts:

4 passwords from the game
Link to a private GitHub repository with the code you wrote in order to solve the game. Give user evo-home-task (or dev-home-task@evolutiongaming.com) access to the repository. 

It is recommended to use TypeScript (but plain ES6 can also be used). If you want or need to build an UI you should use React (but if you are not familiar with it, other frameworks can also be used). Please note that these are recommendations but you are free to pick what you feel more comfortable working with. 

Just in case you would enjoy the extra challenge, we are not including any more instructions, however feel free to ask for more detailed description is you feel you would benefit from it.

If you have any feedback on the task or encounter any problems, please do let us know.

Please reply when you will be able to allocate time for its completion.

Good luck!"

### И что оно делает ?
Исходя из позтановки задачи и 4х уровней сложности, я сделал вывод, что нужно написать автоматизацию - алгоритм, который будет самостоятельно решать "сапера".
Весь челендж в том, что ко всем этим выводам ты должен придти самостоятельно, ведь все что у тебя есть это странная страница с ошибкой https://hometask.eg1236.com/game1/

Самого по себе сапера решить не сложно. Однако когда количество клеток будет 800 или 5000 или больше, это становится значительно сложнее, а вероятность математической ошибки при подсчете вероятностей мин возрастает. А т.к. есть какой-никаой интерфейс, который нужно регулярно обновлять при ответах с сервера существенно вырастает нагрузка и стает вопрос оптимизации

1-й уровень 100 клеток
2-й уровень 800
3-й 5000
4-й 25000 (двадцать пять тысяч клеток! Самурайский меч мне в зад!)

### И что получилось сделать?
Получилось решить первые 2 уровня сложности т.е. написать автоматизацию для решения сапера на 100 и 800 клеток. На 3-м уровне сложности выявляются проблемы с оптмизацией, а так же текущая упрощенная математика при подсчете вероятностей дает о себе знать. Максимум который мне удалось достичь это порядка 1500 открытых решенных клеток.

Есть понимание как это решить, но я предложил обсудить это устно, т.к. уже было потрачено более 2х недель на разработку. 

К сожалению до устного обсуждения не дошло. =/

### Чему научился? Чем можешь похвастаться? Какие технологии использовал?
Typescript, Loadash, update (для обновления стейта) и Websockets. Это мой первый опыт работы с этими штуками. Я отдаю себе отчет в том, что код не идеальный, однако задачу я решил и понимаю как можно усовершенствовать в дальнейшем.
Считаю, что поднять с нуля и начать использовать за 2 недели несколько новых технологий – неплохой показатель, хотябы потому что не вижу в этом ничего супер сложного, страшного и непосильно.

Похвастаться могу тем, что я все-таки это решил, ибо это было не так просто, как может показаться. Есть нюансы. А еще я понял важность понимания алгоритмов и структур данных, лекции и книги о которых буду изучать в ближайшее время. Почему? Потомучто при переходе на каждый последующий уровень возникали ситуации, когда текущее решение оказывалось не достаточно оптимизированным, а значит не дальновидным.

Отметил для себя, что прежде чем браться за работу, необходимо посмотреть все вводные. Дело в том что я взял в работу 1-й уровень, так увлекся им что не посмотрел остальные, будучи в полной уверенности что это будут другие игры. Чтож я был не прав, везде был сапер, с разным количество клеток... СИЛЬНО РАЗНЫМ. 

Самая большая запара была в том что, по какой-то причине, брейкпоинты в хроме, при работе с текущей сборкой и тайпскриптом, в какой-то момент переставали работать. Приходилось перезапукать сборку заново и заново расставлять точки, ибо предыдущие так и оставались внерабочем состоянии. Не знаю проблема ли это сборки, тайпскрипта, хрома или моего ума, но этот момент ОЧЕНЬ СИЛЬНО замедлял работу.

### Тут про то как это поставить и настроить.
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
