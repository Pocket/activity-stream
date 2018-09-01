import {NmfTextTagger} from "lib/NmfTextTagger.jsm";
import {tokenize} from "lib/TfIdfVectorizer.jsm";

const EPSILON = 0.00001;

describe("NMF Tagger", () => {
  describe("#tag", () => {
    // The numbers in this model were pulled from existing trained model.
    let model = {
      document_topic: {
        environment: [0.05313956429537541, 0.07314019377743895, 0.03247190024863182, 0.016189529772591395, 0.003812317145412572, 0.03863075834647775, 0.007495425135831521, 0.005100298003919777, 0.005245622179405364, 0.036196010766427554, 0.02189970342121833, 0.03514130992119014, 0.001248114096050196, 0.0030908722594824665, 0.0023874256586350626, 0.008533674814792993, 0.0009424690250135675, 0.01603124888144218, 0.00752822798092765, 0.0039046678154748796, 0.03521776907836766, 0.00614546613169027, 0.0008272200196643818, 0.01405638079154697, 0.001990670259485496, 0.002803666919676377, 0.013841677883061631, 0.004093362693745272, 0.009310678536276432, 0.006158920150866703, 0.006821027337091937, 0.002712031105462971, 0.009093298611644996, 0.014642160500331744, 0.0067239941045715386, 0.007150418784462898, 0.0064652818600521265, 0.0006735690394489199, 0.02063188588742841, 0.003213083349614106, 0.0031998068360970093, 0.00264520606931871, 0.008854824468146531, 0.0024170562884908786, 0.0013705390639746128, 0.0030575940757273288, 0.010417378215688392, 0.002356164040132228, 0.0026710154645455007, 0.0007295327370144145, 0.0585307418954327, 0.0037987763460599574, 0.003199095437138493, 0.004368800434950577, 0.005087168372751965, 0.0011100904433965942, 0.01700096791869979, 0.01929226435023826, 0.010536397909643058, 0.001734999985783697, 0.003852807194017686, 0.007916805773686475, 0.028375307444815964, 0.0012422599635274355, 0.0009298594944844238, 0.02095410849846837, 0.0017269844428419192, 0.002152880993141985, 0.0030226616228192387, 0.004804812297400959, 0.0012383636748462198, 0.006991278216261148, 0.0013747035300597538, 0.002041541234639563, 0.012076270996247411, 0.006643837514421182, 0.003974012776560734, 0.015794539051705442, 0.007601190171659186, 0.016474925942594837, 0.002729423078513777, 0.007635146179880609, 0.013457547041824648, 0.0007592338429017099, 0.002947096673767141, 0.006371935735541048, 0.003356178481568716, 0.00451933490245723, 0.0019006306992329104, 0.013048046603391707, 0.023541628496101297, 0.027659066125377194, 0.002312727786055524, 0.0014189157259186062, 0.01963766030236683, 0.0026014761547439634, 0.002333697870992923, 0.003401734295211338, 0.002522073778255918, 0.0015769783084977752],
        space: [0.045976774394786174, 0.04386532305052323, 0.03346748817597193, 0.008498345884036708, 0.005802390890667938, 0.0017673346473868704, 0.00468037374691276, 0.0036807899985757367, 0.0034951488381868424, 0.015073756869093244, 0.006784747891785806, 0.03069702365741547, 0.004945214461908244, 0.002527030239506901, 0.0012201743197690308, 0.010191409658936534, 0.0013882500616525532, 0.014559679471816162, 0.005308140956577744, 0.002067005832569046, 0.006092496689239475, 0.0029308442356851265, 0.0006407392160713908, 0.01669972147417425, 0.0018920321527190246, 0.002436089537269062, 0.05542174181989591, 0.006448761215865303, 0.012804154851567844, 0.014553974971946687, 0.004927456148063145, 0.006085620881900181, 0.011626122370522652, 0.002994267915422563, 0.0038291031528493898, 0.006987917175322377, 0.00719289436611732, 0.0008398926158042337, 0.019068654506361523, 0.004453895285397824, 0.00401164781243836, 0.0031309255764704544, 0.013210118660087334, 0.0015542151889036313, 0.0013951089590218057, 0.002790924761398501, 0.008739250167366135, 0.0027834569638271025, 0.09198161284531065, 0.0019488047187835441, 0.001739971582806101, 0.005113637251322287, 0.12140493794373561, 0.005535368890812829, 0.004198222617607059, 0.0010670629105233682, 0.005298717616708989, 0.0048291586850982855, 0.005140125537186181, 0.0011663683373124493, 0.0024499638218810943, 0.012532772497286819, 0.0015564613278042862, 0.0012252899339204029, 0.0005095187051357676, 0.0035442657060978655, 0.014030578705118285, 0.0017653534252553718, 0.004026729875153457, 0.004002067082856801, 0.00809773970333208, 0.017160384509220625, 0.002981945110677171, 0.0018338446554387704, 0.0031886913904107484, 0.004654622711785796, 0.0053886727821435415, 0.009023511029300392, 0.005246967669202147, 0.022806469628558337, 0.0035142224878495355, 0.006793295047927272, 0.017396620747821886, 0.000922278971300957, 0.001695889413253992, 0.007015197552957029, 0.003908581792868586, 0.010136260994789877, 0.0032880552208979508, 0.0039712539426523625, 0.009672046620728448, 0.007290428293346, 0.0017814796852793386, 0.0005388988974780036, 0.013936726486762537, 0.003427738251710856, 0.002206664729558829, 0.05072392472622557, 0.004424158921356747, 0.0003680061331891622],
        biology: [0.054433533850037796, 0.039689474154513994, 0.027661000660240884, 0.021655563357213067, 0.007862624595639219, 0.006280655377019006, 0.013407714984668861, 0.004038592819712647, 0.009652765217013826, 0.0011353987945632667, 0.00925298156804724, 0.004870163054917538, 0.04911204317171355, 0.006921538451191124, 0.004003624507234068, 0.016600722822360296, 0.002179735905957767, 0.010801493818182368, 0.00918922860910538, 0.022115576350545514, 0.0027720850555002148, 0.003290714340925284, 0.0006359939927595049, 0.020564054347194806, 0.019590591011010666, 0.0029008397180383077, 0.030414664509122412, 0.002864704837438281, 0.030933936414333993, 0.00222576969791357, 0.007077232390623289, 0.005876547862506722, 0.016917705934608753, 0.016466207380001166, 0.006648808144677746, 0.017876914915160164, 0.008216930648675583, 0.0026813239798232098, 0.012171904585413245, 0.012319763594831614, 0.003909608203628946, 0.003205613981613637, 0.027729523430009183, 0.0019938396819227074, 0.002752482544417343, 0.0016746657427111145, 0.019564250521109314, 0.027250898086440583, 0.000954251437229793, 0.0020431321836649734, 0.0014636128217840221, 0.006821766389705783, 0.003272989792090916, 0.011086677363737012, 0.0044279892365732595, 0.0029213721398486203, 0.013081117655947345, 0.012102962176204816, 0.0029165848047082825, 0.002363073972325097, 0.0028567640089643695, 0.013692951578614878, 0.0013189478722657382, 0.0030662419379415885, 0.001688218039583749, 0.0007806438728749603, 0.025458033834110355, 0.009584308792578437, 0.0033243840056188263, 0.0068361098488461045, 0.005178034666939756, 0.006831575853694424, 0.010170774789130092, 0.004639315532453418, 0.00655511046953238, 0.005661100806175219, 0.006238755352678196, 0.023282136482285103, 0.007790828526461584, 0.011840304456780202, 0.0021953903460442225, 0.011205225479328193, 0.01665869590158306, 0.0009257333679666402, 0.0032380769616003604, 0.007379754534437712, 0.01804771060116468, 0.02540492978451049, 0.0027900782593570507, 0.0029721824342474694, 0.005666888959879564, 0.003629523931553047, 0.0017838703067849428, 0.004996486217852931, 0.006086510142627035, 0.0023570031997685236, 0.002718397814380002, 0.003908858478916721, 0.02080129902865465, 0.005591305783253238]
      },
      topic_word: [[0.0, 0.0, 0.0, 0.0, 0.0, 0.003173633134427233, 0.0, 0.0, 0.0019409914586816176, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 5.135548639746091e-05, 0.0, 0.0, 0.0, 0.00015384770766669982], [0.0, 0.0, 0.0005001441880557176, 0.0, 0.0, 0.0012069823147301646, 0.02401141538644239, 8.831990149479376e-05, 0.001813504147854849, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0003577161362340021, 0.0005744157863408606, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.002662246533243532, 0.0, 0.0, 0.0008394369973758684, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 4.768637450522633e-05, 0.0, 0.0, 0.0, 0.0, 0.0010421065429755969, 0.0, 0.0, 2.3210938729937306e-05], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0006034363278588148, 0.001690622339085902, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.004257728522853072, 0.0, 0.0, 0.0, 0.0], [0.0007238839225620208, 0.0, 0.0, 0.0, 0.0, 0.0009507496006759083, 0.0012635532859311572, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.2699264109324263e-05, 0.00032868342552128994, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0011157667743487598, 0.001278875789622101, 9.011724853181247e-06, 0.0, 3.22069766200917e-05, 0.004124963644732435], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.00011961487736485771], [0.0, 0.0, 0.0, 5.734703813314615e-05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 4.0340264022466226e-05, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.00039701897786057513, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.19635202968946042, 0.0, 0.0008873887898279083, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 1.552973162326247e-05, 0.0, 0.002284331845105356, 0.0, 0.0], [0.0, 0.0, 0.005561738919282601, 0.0, 0.0, 0.0, 0.010700323065082812, 0.0, 0.0005795117202094265, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0005085828329663487, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.029261090049475084, 0.0020864946050332834, 0.0018513709831557076, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0008328286790309667, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0013227647245223537, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0024010554774254685, 5.357245317969706e-05, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0014484032312145462, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0012081428144960678, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.000616488580813398, 0.0, 0.0, 0.0017954524796671627, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0006660554263924299, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0011891151421092303, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0024885434472066534, 0.0, 0.0010165824086743897, 0.0, 0.0], [0.0, 5.692292246819767e-05, 0.0, 0.0, 0.001006289633741549, 0.0, 0.0, 0.001897882990870404, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.00010646854330751878, 0.0, 0.0013480243353754932, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0002608785715957589, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0010620422134845085, 0.0, 0.0, 0.0002032215308376943, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0008928062238389307, 0.0, 0.0, 5.727265080002417e-05, 0.0], [0.0, 0.0, 0.06061253593083364, 0.0, 0.02739898181912798, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0014338134220455178, 0.0, 0.0011276871850520397, 0.002840121913315777], [0.0008014293374641945, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.000345858724152025, 0.013078498367906305, 0.0, 0.002815596608197659, 0.0, 0.0, 0.0030778986683343023, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0010177321509216356, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.00015333347872060042, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0009655934464519347, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0008542046515290346, 0.0, 0.0, 0.00016472517230317488, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0007759590139787148, 0.0037535348789227703, 0.0007205740927611773], [0.0, 0.0, 0.0010313963595627862, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0069665132800572115, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0006880323929924655, 9.207429290830475e-05, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0008404475484102756, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.00016603822882009137, 0.0, 0.0, 0.0, 0.0004386724451378034], [0.0, 0.0, 0.0, 0.0, 0.0, 0.003971386830918022, 0.0, 0.0, 0.0, 0.0], [0.000983926199078037, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.001299108775819868, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.16326515307916822, 0.0, 0.0, 0.0, 0.0, 0.0028677496385613155, 0.023677620702293598, 0.0, 0.0, 0.0], [0.0, 0.0, 5.737710913345495e-06, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0002081792662367579, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0002840163488982256], [0.0, 0.0, 0.0, 0.0, 0.0005021534925351664, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.001057424953719077, 0.0, 0.003578658690485632, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.00022950619982206556, 0.0018791783657735252, 0.0008530683004027156, 4.5513911743540586e-05, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0045523319463242765, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0006160628426134845, 0.0, 0.0023393152617350653, 0.0, 0.0, 0.0012979890699731222], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.003391399407584813, 0.0, 0.0, 0.000719659722017165, 0.0, 0.004722518573572638, 0.002758841738663124, 0.0], [0.0, 0.0, 0.0, 0.0, 0.002127862313876461, 0.0, 0.005031998155190167, 0.0, 0.0, 0.0], [0.0, 0.0, 0.00055401373160389, 0.0, 0.0, 0.000333325450244618, 0.0017824446558959168, 0.0011398506826041158, 0.0, 0.0006366915431430632], [0.0, 0.21687336139378274, 0.0, 0.0, 0.0, 0.0030345303266644387, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0012637173523723526, 0.0, 0.0010158476831041915, 0.0035425832276585615, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0015451984659512325, 0.019909953764629045, 0.0013484737840911303, 0.0033472098053086113, 0.0016951819626954759], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.00015923419851654453, 0.0, 0.0024056492047359367], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.01305313280419075, 0.00014197157780982973, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.000746430999979358, 0.0, 0.0010041202546700189, 0.004557016648181857, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.00021372865758801545, 0.00025925151316940747, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001658746582791234, 0.0], [0.0, 0.0, 0.0, 0.0, 0.00973640859923001, 0.0012404719999980969, 0.0006365355864806626, 0.0008291013715577852, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.001473459191608214, 0.0, 0.0, 0.0009195459918865811, 0.002012929485852207], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0005850456523130979, 0.0, 0.00014396718214395852, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0011858302272740567, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0046803403116507545, 0.002083219444498354, 0.0, 0.0, 0.0, 0.006104495765365948], [0.0, 0.0, 0.0, 0.0, 0.0, 0.005456944646675863, 0.0, 0.00011428354610339084, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0013384597578988894, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0018450592044551373, 0.0, 0.005182965872305058, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0003041074021307749, 0.0, 0.0020827735275448823, 0.0, 0.0008494429669380388], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]],
      vocab_idfs: {
        blood:   [0, 5.0948820521571045],
        earth:   [1, 4.2248041634380815],
        rocket:  [2, 5.6666683757127820],
        brain:   [3, 4.6168462512141040],
        mars:    [4, 6.2262841636482050],
        nothing: [5, 5.2707727186207690],
        nada:    [6, 4.8152971899379430],
        star:    [7, 6.3888030931459800],
        zilch:   [8, 5.8898119270269920],
        soil:    [9, 7.1425748955223600]
      }
    };

    let instance = new NmfTextTagger(model);

    let testCases = [
      {
        input: "blood is in the brain",
        expected: {
          environment: 0.00037336337061919943,
          space: 0.0003307690554984028,
          biology: 0.0026549079818439627
        }
      },

      {
        input: "rocket to the star",
        expected: {
          environment: 0.0002855180592590448,
          space: 0.004006242743506598,
          biology: 0.0003094182371360131
        }
      },
      {
        input: "rocket to the star mars",
        expected: {
          environment: 0.0004180326651780644,
          space: 0.003844259295376754,
          biology: 0.0003135623817729136
        }
      },
      {
        input: "rocket rocket rocket",
        expected: {
          environment: 0.00033052002469507015,
          space: 0.007519787053895712,
          biology: 0.00031862864995569246
        }
      },
      {
        input: "nothing nada rocket",
        expected: {
          environment: 0.0008597524218029812,
          space: 0.0035401031629944506,
          biology: 0.000950627767326667
        }
      },
      {
        input: "rocket",
        expected: {
          environment: 0.00033052002469507015,
          space: 0.007519787053895712,
          biology: 0.00031862864995569246
        }
      },
      {
        input: "this sentence is out of vocabulary",
        expected: {
          environment: 0.0,
          space: 0.0,
          biology: 0.0
        }
      },
      {
        input: "this sentence is out of vocabulary except for rocket",
        expected: {
          environment: 0.00033052002469507015,
          space: 0.007519787053895712,
          biology: 0.00031862864995569246
        }
      }
    ];

    let checkTag = tc => {
      let actual = instance.tagTokens(tokenize(tc.input));
      it(`should score ${tc.input} correctly`, () => {
        Object.keys(actual).forEach(tag => {
          let delta = Math.abs(tc.expected[tag] - actual[tag]);
          assert.isTrue(delta <= EPSILON);
        });
      });
    };

    // RELEASE THE TESTS!
    for (let tc of testCases) {
      checkTag(tc);
    }
  });
});
